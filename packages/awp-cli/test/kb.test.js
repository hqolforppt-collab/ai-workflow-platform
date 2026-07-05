/**
 * kb.test.js — domain-knowledge validator (kb.js) + staleness math.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { validateKb, addPeriod } from "../src/kb.js"

function scaffold() {
  const root = mkdtempSync(join(tmpdir(), "awp-kb-"))
  mkdirSync(join(root, ".ai"), { recursive: true })
  writeFileSync(join(root, ".ai", "constitution.md"), "status: active\n")
  mkdirSync(join(root, ".memory", "domain-knowledge"), { recursive: true })
  return root
}

function writeDomain(root, id, body) {
  writeFileSync(join(root, ".memory", "domain-knowledge", `${id}.yaml`), body)
}

const GOOD = (id, implies = "[]") => `id: ${id}
type: functional
version: 1.0.0
triggers: [${id}]
implies: ${implies}
constraints:
  - { id: XXX-C1, rule: "a concrete rule with enough length" }
blueprint-sections: [requirements]
`

test("valid domain passes with no errors", () => {
  const root = scaffold()
  try {
    writeDomain(root, "alpha", GOOD("alpha"))
    const { errors } = validateKb(root)
    assert.equal(errors.length, 0)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("KB-I1: dangling implies is an error", () => {
  const root = scaffold()
  try {
    writeDomain(root, "alpha", GOOD("alpha", "[ghost]"))
    const { errors } = validateKb(root)
    assert.ok(errors.some((e) => e.code === "KB-I1" && e.hint.includes("ghost")))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("KB-I4: duplicate id across files is an error", () => {
  const root = scaffold()
  try {
    writeDomain(root, "alpha", GOOD("alpha"))
    // second file, different filename, same id
    writeFileSync(join(root, ".memory", "domain-knowledge", "alpha2.yaml"), GOOD("alpha"))
    const { errors } = validateKb(root)
    assert.ok(errors.some((e) => e.code === "KB-I4"))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("KB-FIELD: bad constraint id is caught", () => {
  const root = scaffold()
  try {
    writeDomain(root, "alpha", `id: alpha
type: functional
version: 1.0.0
triggers: [alpha]
constraints:
  - { id: bad_id, rule: "a concrete rule with enough length" }
blueprint-sections: [requirements]
`)
    const { errors } = validateKb(root)
    assert.ok(errors.some((e) => e.code === "KB-FIELD" && e.path.includes("constraints")))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("KB-STALE: overdue review warns", () => {
  const root = scaffold()
  try {
    writeDomain(root, "alpha", GOOD("alpha") + `review:
  cadence: P6M
  last-reviewed: 2020-01-01
  owner: x
`)
    const { warnings } = validateKb(root, { today: "2026-07-05" })
    assert.ok(warnings.some((w) => w.code === "KB-STALE"))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("addPeriod handles Y/M/D", () => {
  assert.equal(addPeriod("2026-01-01", "P12M"), "2027-01-01")
  assert.equal(addPeriod("2026-01-01", "P1Y"), "2027-01-01")
  assert.equal(addPeriod("2026-01-01", "P30D"), "2026-01-31")
  assert.equal(addPeriod("bad", "P1Y"), null)
})
