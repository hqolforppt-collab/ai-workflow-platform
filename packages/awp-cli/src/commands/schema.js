/**
 * schema.js (command) — `awp schema check`.
 *
 * Two deterministic guards on the blueprint schema, both now possible because
 * schema.yaml is strict-parseable YAML (v3.0):
 *   1. schema.yaml parses.
 *   2. every `required: true` field name in schema.yaml appears in
 *      schema-summary.yaml — the summary's own stated contract, so the
 *      small-model tier can never silently drift from the full schema.
 *
 * Run in CI to catch a stale summary the moment a required field is added.
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import YAML from "yaml"
import { requireRepoRoot } from "../lib/repo.js"

const SCHEMA = ".schemas/workflow-blueprint/schema.yaml"
const SUMMARY = ".schemas/workflow-blueprint/schema-summary.yaml"

export async function schema(sub, flags) {
  const root = requireRepoRoot()
  if (sub && sub !== "check") {
    console.error(`awp schema: unknown subcommand "${sub}". Usage: awp schema check`)
    return 1
  }
  return schemaCheck(root)
}

export function schemaCheck(root) {
  const schemaPath = join(root, SCHEMA)
  const summaryPath = join(root, SUMMARY)
  const problems = []

  let doc
  const raw = readFileSync(schemaPath, "utf8")
  try {
    doc = YAML.parse(raw)
  } catch (err) {
    console.error(`✗ ${SCHEMA} does not parse: ${err.message.split("\n")[0]}`)
    return 1
  }

  // Collect field names that are declared required anywhere in the schema tree.
  // Skip structural schema keywords (item/items/attributes describe shape, not
  // blueprint fields, so they needn't appear verbatim in the summary).
  const STRUCTURAL = new Set(["item", "items", "attributes", "attribute"])
  const requiredFields = new Set()
  walk(doc, (key, node, parentKey) => {
    if (node && typeof node === "object" && node.required === true && parentKey && !STRUCTURAL.has(parentKey)) {
      requiredFields.add(parentKey)
    }
  })

  const summaryText = existsSync(summaryPath) ? readFileSync(summaryPath, "utf8") : ""
  const missing = [...requiredFields].filter((f) => !summaryText.includes(f)).sort()

  if (missing.length) {
    for (const f of missing) problems.push(`required field "${f}" not represented in schema-summary.yaml`)
  }

  if (problems.length) {
    console.error(`✗ schema check: ${problems.length} issue(s)`)
    for (const p of problems) console.error(`  ! ${p}`)
    console.error(`\nUpdate ${SUMMARY} to cover the fields above.`)
    return 1
  }

  console.log(`✓ schema check: parses; ${requiredFields.size} required fields all present in summary`)
  return 0
}

/** Walk a parsed YAML tree, invoking fn(key, node, parentKey) for each object. */
function walk(node, fn, key = null, parentKey = null) {
  if (Array.isArray(node)) {
    for (const v of node) walk(v, fn, key, parentKey)
    return
  }
  if (node && typeof node === "object") {
    fn(key, node, parentKey)
    for (const [k, v] of Object.entries(node)) walk(v, fn, k, key)
  }
}
