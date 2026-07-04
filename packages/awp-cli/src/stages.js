/**
 * stages.js — 6-stage orchestration engine for /workflow-builder.
 *
 * Reads stages.yaml to determine order, dependencies, schema sections per stage,
 * and context threading. Each stage is a function that:
 *   1. Assembles a prompt from prompt.md + schema slice + KB slice + prior stage outputs
 *   2. Calls the model (via model.js)
 *   3. Writes the stage output file
 *   4. Emits a [STAGE n/6] progress marker
 *
 * Supports --resume-from=stage-0N to re-run from a specific stage using existing files.
 */
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tryReadYaml } from "./lib/repo.js"

/**
 * Run all 6 stages sequentially.
 *
 * @param {object} opts
 * @param {string} opts.root        — repo root
 * @param {string} opts.story       — user story
 * @param {string} opts.slug        — slugified story (output dir name)
 * @param {string} opts.level       — maturity level L1-L6
 * @param {string} opts.tier        — model tier (small|medium|large)
 * @param {string} opts.outDir      — output directory
 * @param {string|null} opts.resumeFrom — stage id to resume from (e.g. "stage-04")
 * @param {Function} opts.runStage  — async (stageDef, context) => {content}
 * @returns {Promise<Array<{stage, name, file, lines, error?:string}>>}
 */
export async function runPipeline(opts) {
  const { root, story, slug, level, tier, outDir, resumeFrom, runStage } = opts

  const stagesYaml = tryReadYaml(join(root, ".commands/workflow-builder/stages.yaml"))
  const stages = stagesYaml?.stages || []

  const outputDir = join(root, outDir, slug)
  mkdirSync(outputDir, { recursive: true })

  const results = []
  const priorContents = {}

  // If resuming, load existing prior-stage files as context
  if (resumeFrom) {
    for (const s of stages) {
      const filePath = join(outputDir, s.file)
      if (existsSync(filePath)) {
        priorContents[s.id] = readFileSync(filePath, "utf8")
      }
      if (s.id === resumeFrom) break
    }
  }

  // Track which stages to skip (those before resume point with existing files)
  let skipUntil = null
  if (resumeFrom) {
    skipUntil = resumeFrom
  }

  for (const stageDef of stages) {
    const stageNum = parseInt(stageDef.id.split("-")[1])

    // Skip stages before resume point
    if (skipUntil && stageDef.id !== skipUntil) {
      const filePath = join(outputDir, stageDef.file)
      const lines = existsSync(filePath) ? readFileSync(filePath, "utf8").split("\n").length : 0
      results.push({ stage: stageNum, name: stageDef.name, file: stageDef.file, lines, skipped: true })
      continue
    }
    if (stageDef.id === skipUntil) skipUntil = null // start running from here

    // Assemble context from prior stages
    const context = {
      story,
      level,
      tier,
      slug,
      stageNum,
      stageName: stageDef.name,
      schemaSections: stageDef.schema_sections || [],
      pipelineSteps: stageDef.pipeline_steps || [],
      priorContents,
      kbSlice: stageDef.kb_slice || [],
      workflowsScope: stageDef.workflows_scope || null,
    }

    try {
      const content = await runStage(stageDef, context)

      const filePath = join(outputDir, stageDef.file)
      writeFileSync(filePath, content, "utf8")
      priorContents[stageDef.id] = content
      const lines = content.split("\n").length

      results.push({ stage: stageNum, name: stageDef.name, file: stageDef.file, lines })
    } catch (err) {
      results.push({ stage: stageNum, name: stageDef.name, file: stageDef.file, lines: 0, error: err.message })
      // Preserve prior stages; stop pipeline
      break
    }
  }

  return results
}

/**
 * Assemble the prompt for a single stage.
 * Returns {systemPrompt, userPrompt} to send to the model.
 */
export function assembleStagePrompt(opts) {
  const { root, stageDef, context, tier } = opts

  const promptMd = readFileSync(join(root, ".commands/workflow-builder/prompt.md"), "utf8")

  // Choose schema based on tier
  let schemaPath
  if (tier === "small") {
    schemaPath = join(root, ".schemas/workflow-blueprint/schema-summary.yaml")
    if (!existsSync(schemaPath)) schemaPath = join(root, ".schemas/workflow-blueprint/schema.yaml")
  } else {
    schemaPath = join(root, ".schemas/workflow-blueprint/schema.yaml")
  }
  const schemaYaml = readFileSync(schemaPath, "utf8")

  // KB slice
  let kbContent = ""
  const kbIndexPath = join(root, ".memory/domain-knowledge/index.yaml")
  if (existsSync(kbIndexPath) && context.kbSlice?.length) {
    kbContent = readFileSync(kbIndexPath, "utf8")
  }

  // Prior stage summaries
  let priorSummary = ""
  for (const [sid, content] of Object.entries(context.priorContents || {})) {
    priorSummary += `\n## Prior stage output: ${sid}\n\n${content.slice(0, 2000)}\n`
  }

  // Pipeline step instructions
  const pipelineSteps = (stageDef.pipeline_steps || []).join(", ")

  const systemPrompt = `You are executing the /workflow-builder command, stage ${context.stageNum}/6: ${context.stageName}.
Follow the execution prompt below. Output ONLY the YAML for this stage — do not include other stages' sections.

${promptMd}`

  const userPrompt = `## Stage ${context.stageNum}/6: ${context.stageName}

Pipeline steps to execute: ${pipelineSteps}
Schema sections to populate: ${(context.schemaSections || []).join(", ")}
Maturity level: ${context.level}
Model tier: ${tier}
${context.workflowsScope ? `Workflows scope: ${context.workflowsScope}` : ""}

## User story

${context.story}

## Output schema (sections for this stage)

\`\`\`yaml
${schemaYaml}
\`\`\`

${kbContent ? "## Domain knowledge\\n\\n```yaml\\n" + kbContent + "\\n```\\n" : ""}
${priorSummary}

Write the file \`${stageDef.file}\` for stage ${context.stageNum} (${context.stageName}).
Begin with a _meta block: blueprint_id, stage, produced_by, maturity_level, depends_on.
Then populate ONLY these schema sections: ${(context.schemaSections || []).join(", ")}.
Output valid YAML only — no markdown fences, no commentary.`

  return { systemPrompt, userPrompt }
}
