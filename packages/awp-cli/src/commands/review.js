/**
 * review.js (command) — `awp review <blueprint-dir>`.
 *
 * Advisory quality review. Two layers:
 *   1. Deterministic constraint-coverage (coverage.js) — always runs, no model.
 *   2. Graded rubric review — if a model provider is configured, each section is
 *      scored (specificity / consistency / constraint-coverage) with findings
 *      tagged `advisory`. Uses the existing model.js provider stack incl. the
 *      `mock` provider so CI can smoke-test the path with no secrets.
 *
 * By design this NEVER gates: it emits review-report.yaml and exits 0 even when
 * scores are low. Humans approve; models only prepare evidence (Constitution).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join, isAbsolute } from "node:path"
import YAML from "yaml"
import { requireRepoRoot, tryReadYaml } from "../lib/repo.js"
import { computeCoverage, coverageLine } from "../coverage.js"
import { loadModelConfig, detectTier, streamModelCall } from "../model.js"

export async function review(flags) {
  const root = requireRepoRoot()
  const target = (flags._ || [])[0]
  if (!target) {
    console.error('awp review: no blueprint given. Usage: awp review <blueprint-dir>')
    return 1
  }
  const targetPath = isAbsolute(target) ? target : join(root, target)
  if (!existsSync(targetPath)) {
    console.error(`awp review: path not found: ${targetPath}`)
    return 1
  }

  const { rawText, sections, story } = loadBlueprint(targetPath, flags)

  // ---- layer 1: deterministic coverage -----------------------------------
  const cov = computeCoverage(root, story, rawText)

  // ---- layer 2: graded rubric (optional) ----------------------------------
  const cfg = loadModelConfig(root)
  let graded = null
  if (flags["no-model"]) {
    // skip
  } else if (cfg.provider === "mock" || process.env[cfg.apiKeyEnv]) {
    graded = await gradeSections(root, cfg, sections)
  }

  // ---- report -------------------------------------------------------------
  const report = {
    _meta: { produced_by: "awp review", advisory: true, gates: false },
    story,
    coverage: {
      domains_reflected: cov.domainsReflected,
      domains_total: cov.domainsTotal,
      domains_with_citation: cov.domainsWithCitation,
      constraints_cited: cov.constraintsCited,
      constraints_total: cov.constraintsTotal,
      constraint_percent: cov.constraintsTotal ? Math.round((cov.constraintsCited / cov.constraintsTotal) * 100) : 0,
      per_domain: cov.perDomain,
    },
    graded: graded || "skipped (no model provider configured; run with a provider or provider: mock)",
  }

  const outPath = flags.out
    ? (isAbsolute(flags.out) ? flags.out : join(root, flags.out))
    : join(targetPath.endsWith(".yaml") ? join(targetPath, "..") : targetPath, "review-report.yaml")
  writeFileSync(outPath, YAML.stringify(report, { lineWidth: 0 }))

  console.log(`awp review (advisory — does not gate)`)
  console.log(coverageLine(cov))
  if (graded) {
    const avg = graded.reduce((s, g) => s + (g.score || 0), 0) / (graded.length || 1)
    console.log(`Graded sections: ${graded.length}, mean score ${avg.toFixed(1)}/5`)
    for (const g of graded.filter((g) => (g.score || 0) < 3)) {
      console.log(`  ⚠ ${g.section.padEnd(16)} ${g.score}/5 — ${g.finding}`)
    }
  } else {
    console.log(`Graded review: skipped (configure a model provider or set provider: mock)`)
  }
  console.log(`\nWrote ${outPath}`)
  return 0
}

// ---------------------------------------------------------------------------

function loadBlueprint(targetPath, flags) {
  let rawText = ""
  const sections = {}
  if (targetPath.endsWith(".yaml")) {
    rawText = readFileSync(targetPath, "utf8")
    Object.assign(sections, tryReadYaml(targetPath) || {})
  } else {
    const entries = readdirSync(targetPath).filter((f) => /^\d{2}-.*\.yaml$/.test(f)).sort()
    for (const e of entries) {
      const t = readFileSync(join(targetPath, e), "utf8")
      rawText += `\n# ${e}\n` + t
      Object.assign(sections, tryReadYaml(join(targetPath, e)) || {})
    }
  }
  const story = typeof flags.story === "string" ? flags.story
    : (sections.project && sections.project.story) || ""
  return { rawText, sections, story }
}

/** Grade a curated set of high-value sections with the configured model. */
async function gradeSections(root, cfg, sections) {
  const tierData = tryReadYaml(join(root, ".commands/workflow-builder/tiers.yaml"))
  const tier = detectTier(cfg.modelId, tierData, cfg.tierOverride)
  const targets = ["requirements", "security", "workflows", "compliance", "testing"].filter((s) => sections[s])
  const out = []
  for (const sec of targets) {
    const content = YAML.stringify({ [sec]: sections[sec] }, { lineWidth: 0 }).slice(0, 6000)
    const systemPrompt = "You are a meticulous blueprint reviewer. Score 1-5 for specificity + internal consistency + concreteness. Respond as compact JSON: {\"score\": <1-5>, \"finding\": \"<one sentence>\"}. Only JSON."
    const userPrompt = `Review this blueprint section for quality (concrete values, no vagueness, internal consistency):\n\n${content}`
    let text = ""
    for await (const ev of streamModelCall({ systemPrompt, userPrompt, config: cfg, tier, stageFile: `review-${sec}.json` })) {
      if (ev.content) text += ev.content
    }
    out.push({ section: sec, ...parseScore(text) })
  }
  return out
}

function parseScore(text) {
  try {
    const m = /\{[\s\S]*\}/.exec(text)
    if (m) {
      const o = JSON.parse(m[0])
      const score = Math.max(1, Math.min(5, Number(o.score) || 3))
      return { score, finding: String(o.finding || "").slice(0, 200) }
    }
  } catch { /* fall through */ }
  return { score: 3, finding: "unparseable model response (advisory)" }
}
