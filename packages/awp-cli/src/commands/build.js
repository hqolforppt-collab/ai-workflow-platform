import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { requireRepoRoot, tryReadYaml } from "../lib/repo.js"

/**
 * awp build <story> — assemble the /workflow-builder prompt from prompt.md +
 * the domain-knowledge index + the blueprint schema, and write the assembled
 * prompt to disk so it can be piped into the user's configured model.
 *
 * v0.1 intentionally contains no model calls: it produces a complete,
 * self-contained prompt file (deterministic, reviewable, tool-agnostic).
 */
export async function build(flags) {
  const root = requireRepoRoot()
  const story = flags._.join(" ").trim()
  const checkOnly = flags.check === true

  if (!story && !checkOnly) {
    console.error('awp build: a user story is required. Example: awp build "Create login and registration feature"')
    return 1
  }

  const level = typeof flags.level === "string" ? flags.level.toUpperCase() : "L6"
  if (!/^L[1-6]$/.test(level)) {
    console.error(`awp build: invalid maturity level "${flags.level}". Use L1..L6.`)
    return 1
  }

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

  const slug = slugify(story)
  const outPath = flags.out ? String(flags.out) : join(root, "blueprints", `${slug}.prompt.md`)

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

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}
