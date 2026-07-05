/**
 * coverage.test.js — constraint-coverage metric + schema-check drift guard.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { computeCoverage, coverageLine } from "../src/coverage.js"
import { schemaCheck } from "../src/commands/schema.js"
import { findRepoRoot } from "../src/lib/repo.js"

function domains() {
  const m = new Map()
  m.set("payments", {
    id: "payments", type: "functional", triggers: ["payment"],
    constraints: [{ id: "PAY-C1", rule: "x" }, { id: "PAY-C2", rule: "y" }],
    "requirement-seeds": [{ id: "discovery/payments/REQ-1", title: "t", ac: "a" }],
  })
  m.set("security", { id: "security", type: "cross-cutting", triggers: ["ANY-USER-FACING"], constraints: [{ id: "SEC-C1", rule: "z" }] })
  return m
}

test("domain reflection vs constraint citation", () => {
  const text = `
requirements:
  - id: REQ-001
    source: discovery/payments
    note: enforces PAY-C1
`
  const cov = computeCoverage(null, "process a payment", text, { domains: domains() })
  // payments reflected (discovery/payments) + security reflected? security id not in text
  assert.ok(cov.domainsReflected >= 1)
  // PAY-C1 cited, PAY-C2 + seed + SEC-C1 not
  assert.equal(cov.constraintsCited, 1)
  assert.ok(cov.constraintsTotal >= 3)
  assert.match(coverageLine(cov), /Domain reflection.*Constraint citation/)
})

test("no citations => 0 constraint coverage", () => {
  const cov = computeCoverage(null, "process a payment", "requirements: []", { domains: domains() })
  assert.equal(cov.constraintsCited, 0)
})

test("schema.yaml parses and summary covers required fields (real repo)", () => {
  const root = findRepoRoot()
  if (!root) return // not in repo (isolated CI checkout); skip
  const code = schemaCheck(root)
  assert.equal(code, 0)
})
