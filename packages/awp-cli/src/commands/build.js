import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { requireRepoRoot, tryReadYaml } from "../lib/repo.js"
import { loadModelConfig, detectTier, streamModelCall } from "../model.js"
import { runPipeline, assembleStagePrompt } from "../stages.js"
import { validateBlueprint } from "../validate.js"

/**
 * awp build <story> — assemble the /workflow-builder prompt and optionally
 * execute it against a configured model.
 *
 * v0.1:  assemble .prompt.md only (no model calls)           [unchanged default]
 * v2.0:  --execute calls the model in 6 staged stages
 *        --staged produces 6 incremental YAML files
 *        --model-tier forces a tier
 *        --resume-from re-runs from a specific stage
 *        --aggregate merges staged files into one blueprint.yaml
 */
export async function build(flags) {
  const root = requireRepoRoot()
  const story = flags._.join(" ").trim()
  const checkOnly = flags.check === true
  const execute = flags.execute === true
  const staged = flags.staged === true
  const noValidate = flags["no-validate"] === true
  const resumeFrom = typeof flags["resume-from"] === "string" ? flags["resume-from"] : null
  const aggregate = flags.aggregate === true

  if (!story && !checkOnly && !aggregate) {
    console.error('awp build: a user story is required. Example: awp build "Create login and registration feature"')
    return 1
  }

  const level = typeof flags.level === "string" ? flags.level.toUpperCase() : "L6"
  if (!/^L[1-6]$/.test(level)) {
    console.error(`awp build: invalid maturity level "${flags.level}". Use L1..L6.`)
    return 1
  }

  const slug = slugify(story || "aggregate")

  // -----------------------------------------------------------------------
  // --aggregate: merge staged files → single blueprint.yaml
  // -----------------------------------------------------------------------
  if (aggregate) {
    let targetDir = typeof flags.out === "string" ? flags.out : join(root, "blueprints", slug)
    if (!existsSync(targetDir)) {
      console.error(`awp build --aggregate: directory not found: ${targetDir}`)
      return 1
    }
    const agg = mergeStagedFiles(targetDir)
    const outPath = join(targetDir, "blueprint.yaml")
    writeFileSync(outPath, agg, "utf8")
    console.log(`awp build --aggregate: merged staged files → ${outPath}`)
    return 0
  }

  // -----------------------------------------------------------------------
  // --check: verify prompt-assembly inputs present (v0.1 behavior)
  // -----------------------------------------------------------------------
  const promptPath = join(root, ".commands/workflow-builder/prompt.md")
  const schemaPath = join(root, ".schemas/workflow-blueprint/schema.yaml")
  const kbIndexPath = join(root, ".memory/domain-knowledge/index.yaml")
  const levelsPath = join(root, ".commands/workflow-builder/maturity-levels.yaml")

  for (const [label, p] of [
    ["workflow-builder prompt", promptPath],
    ["blueprint schema", schemaPath],
    ["domain-knowledge index", kbIndexPath],
  ]) {
    if (!existsSync(p)) {
      console.error(`awp build: missing required artifact: ${label} (${p})`)
      return 1
    }
  }

  if (checkOnly) {
    console.log("awp build --check: all prompt-assembly inputs present")
    return 0
  }

  // -----------------------------------------------------------------------
  // --execute: run the model (v2.0)
  // -----------------------------------------------------------------------
  if (execute) {
    return executeBuild({ root, story, slug, level, flags, staged, noValidate, resumeFrom })
  }

  // -----------------------------------------------------------------------
  // Default: assemble .prompt.md (v0.1 behavior, backward-compatible)
  // -----------------------------------------------------------------------
  const outPathFlag = flags.out ? String(flags.out) : null
  const outPath = outPathFlag || join(root, "blueprints", `${slug}.prompt.md`)

  const sections = [
    "<!-- Assembled by awp build v0.1 — pipe this prompt into your configured model. -->",
    `<!-- story: ${story} -->`,
    `<!-- maturity level: ${level} -->`,
    "",
    readFileSync(promptPath, "utf8"),
    "",
    "---",
    "",
    "## Maturity level for this run",
    "",
    `Target level: **${level}**`,
    existsSync(levelsPath) ? "\n```yaml\n" + readFileSync(levelsPath, "utf8") + "\n```" : "",
    "",
    "## Domain knowledge index (trigger map)",
    "",
    "```yaml",
    readFileSync(kbIndexPath, "utf8"),
    "```",
    "",
    "## Blueprint schema (output contract — all sections required at L6)",
    "",
    "```yaml",
    readFileSync(schemaPath, "utf8"),
    "```",
    "",
    "---",
    "",
    "## User story",
    "",
    `> ${story}`,
    "",
    `Produce the complete workflow blueprint YAML at maturity level ${level},`,
    `then write it to \`blueprints/${slug}.yaml\`.`,
    "",
  ]

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, sections.join("\n"))

  const kb = tryReadYaml(kbIndexPath)
  const domainCount = kb && kb.domains ? Object.keys(kb.domains).length : "?"

  console.log("awp build — prompt assembled")
  console.log(`  story:     ${story}`)
  console.log(`  level:     ${level}`)
  console.log(`  domains:   ${domainCount} in knowledge base`)
  console.log(`  written:   ${outPath}`)
  console.log("")
  console.log("Next: pipe the prompt into your model, e.g.")
  console.log(`  cat "${outPath}" | <your-model-cli> > blueprints/${slug}.yaml`)
  return 0
}

// ---------------------------------------------------------------------------
// --execute implementation
// ---------------------------------------------------------------------------
async function executeBuild(opts) {
  const { root, story, slug, level, flags, staged, noValidate, resumeFrom } = opts

  // Load config
  let config
  try {
    config = loadModelConfig(root)
  } catch {
    console.error("awp build --execute: failed to load .awp/config.yaml. Run `awp init` or create .awp/config.yaml.")
    return 1
  }

  // Tier detection
  const tiersYaml = tryReadYaml(join(root, ".commands/workflow-builder/tiers.yaml"))
  const tierFlag = typeof flags["model-tier"] === "string" ? flags["model-tier"] : null
  const tier = detectTier(config.modelId, tiersYaml, tierFlag || config.tierOverride)
  const maturityLevel = level

  if (tier === "small" && ["L4", "L5", "L6"].includes(maturityLevel)) {
    console.warn(`[WARN] Small model tier limits output to L3. Re-run with --model-tier=medium or large for L4+.`)
  }

  console.log(`/workflow-builder: ${story} (${maturityLevel}, tier=${tier})`)

  // Check API key
  const apiKey = process.env[config.apiKeyEnv]
  if (!apiKey) {
    console.error(`awp build --execute: env var ${config.apiKeyEnv} not set`)
    return 1
  }

  const outDir = typeof flags.out === "string" ? dirname(flags.out) : config.outputDir

  // Run the 6-stage pipeline
  const results = await runPipeline({
    root,
    story,
    slug,
    level: maturityLevel,
    tier,
    outDir,
    resumeFrom,
    runStage: async (stageDef, context) => {
      const { systemPrompt, userPrompt } = assembleStagePrompt({ root, stageDef, context, tier })

      // Emit progress
      const stageNum = parseInt(stageDef.id.split("-")[1])
      console.log(`[STAGE ${stageNum}/6] ${stageDef.name} — generating...`)

      // Call model
      let content = ""
      for await (const ev of streamModelCall({ systemPrompt, userPrompt, config, tier })) {
        if (ev.error) throw new Error(ev.error)
        content = ev.content || content
      }

      console.log(`[STAGE ${stageNum}/6] ${stageDef.name} — done`)
      return content
    },
  })

  // Print stage results
  let totalLines = 0
  for (const r of results) {
    if (r.skipped) {
      console.log(`  (skipped) ${r.file}  — already exists`)
    } else if (r.error) {
      console.error(`  FAILED   ${r.file}  — ${r.error}`)
    } else {
      console.log(`  ${r.file.padEnd(28)} ${r.lines} lines`)
      totalLines += r.lines
    }
  }

  const slugDir = join(root, outDir, slug)
  console.log(`\n✓ ${slugDir}/  (${results.filter(r => !r.skipped).length} files, ${totalLines} lines)`)

  // Validation
  if (!noValidate) {
    const { passed, failed } = validateBlueprint(root, slugDir, { story, level: maturityLevel })
    const ruleCount = passed.length + failed.length
    if (failed.length === 0) {
      console.log(`✓ Validation: ${ruleCount}/${ruleCount} rules passed (deterministic)`)
    } else {
      console.log(`✗ Validation: ${passed.length}/${ruleCount} rules passed`)
      console.log("")
      console.log("FAILED RULES")
      for (const f of failed) {
        console.log(`  ${f.rule} ${f.file.padEnd(30)} ${f.path.padEnd(40)} → ${f.hint}`)
      }
      console.log(`\nStatus: DRAFT-INVALID (files retained for repair; re-run with --resume-from)`)
      return 1
    }
  }

  // Coverage summary
  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    console.log(`\n${errors.length} stage(s) failed. Prior stage files preserved.`)
    return 1
  }

  console.log(`\nFlowable-ready ✓   awp flowable deploy ${slugDir}/`)
  return 0
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}

function mergeStagedFiles(dir) {
  const { readdirSync: ls, readFileSync: rf } = require("node:fs")
  const { join: j } = require("node:path")
  const entries = ls(dir).filter(f => f.match(/^\d{2}-.*\.yaml$/)).sort()
  const parts = []
  for (const entry of entries) {
    parts.push(rf(j(dir, entry), "utf8"))
  }
  return parts.join("\n---\n")
}
