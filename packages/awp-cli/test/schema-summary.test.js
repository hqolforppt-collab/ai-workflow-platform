import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const REPO = join(here, "..", "..", "..")

// F1.3 golden test: the small-tier schema summary must not drift from the full
// schema — every `required: true` field name in schema.yaml must appear in
// schema-summary.yaml.
//
// NB: schema.yaml uses `type: list[string]` inline, which is not strict YAML
// (the `[...]` reads as a flow sequence), so it is a text contract, never
// parsed. We scan its text for inline `{ ... required: true }` field entries.
test("every required field in schema.yaml appears in schema-summary.yaml", () => {
  const schema = readFileSync(join(REPO, ".schemas/workflow-blueprint/schema.yaml"), "utf8")
  const summary = readFileSync(join(REPO, ".schemas/workflow-blueprint/schema-summary.yaml"), "utf8").toLowerCase()

  const required = new Set()
  const re = /^\s*"?([A-Za-z][\w-]*)"?\s*:\s*\{[^}]*\brequired:\s*true\b/gm
  let m
  while ((m = re.exec(schema)) !== null) required.add(m[1].toLowerCase())

  assert.ok(required.size >= 20, `expected to find many required fields, found ${required.size}`)
  const missing = [...required].filter((name) => !summary.includes(name))
  assert.deepEqual(missing, [], "required fields missing from schema-summary.yaml: " + missing.join(", "))
})
