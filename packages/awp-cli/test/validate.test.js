import { test } from "node:test"
import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { validateBlueprint } from "../src/validate.js"

const here = dirname(fileURLToPath(import.meta.url))
const REPO = join(here, "..", "..", "..")
const GOLDEN = join(REPO, "examples", "workflow-builder", "login-registration")

test("golden staged example passes 17/17 rules", () => {
  const { passed, failed } = validateBlueprint(REPO, GOLDEN, {
    story: "Create Login and Registration Feature",
    level: "L6",
  })
  assert.equal(failed.length, 0, "unexpected failures: " + JSON.stringify(failed, null, 2))
  assert.equal(passed.length, 17)
})

test("aggregated blueprint.yaml also passes 17/17", () => {
  const { failed } = validateBlueprint(REPO, join(GOLDEN, "blueprint.yaml"), {
    story: "Create Login and Registration Feature",
    level: "L6",
  })
  assert.equal(failed.length, 0, "unexpected failures: " + JSON.stringify(failed, null, 2))
})

test("broken fixture fails with the expected rule ids", () => {
  const fx = join(here, "fixtures", "staged-broken")
  const { failed } = validateBlueprint(REPO, fx, { story: "Create Login feature", level: "L6" })
  const rules = new Set(failed.map((f) => f.rule))
  assert.ok(rules.has("VAL-021"), "expected VAL-021 (missing acceptance-criteria)")
  assert.ok(rules.has("VAL-020"), "expected VAL-020 (bad id pattern)")
})
