/**
 * rules-ext.test.js — schema-conformance (050-054) + substance lints (060-063).
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { extendedRules } from "../src/rules-ext.js"

const SECTIONS = ["project", "requirements", "workflows", "decision-tables"]

function base() {
  return {
    project: { id: "BLU-X", "maturity-level": "L6" },
    requirements: {
      explicit: [{ id: "REQ-001", title: "Login", description: "user can log in", "acceptance-criteria": ["Given a user, When they submit valid creds, Then a session starts"] }],
      hidden: [],
    },
    workflows: { root: { id: "WF-001", name: "Login", requirements: ["REQ-001"], steps: [] } },
  }
}

test("clean blueprint passes all extended rules", () => {
  const { failed } = extendedRules(base(), { "aggregate": base() }, { level: "L6", schemaSections: SECTIONS })
  assert.equal(failed.length, 0)
})

test("VAL-050: bad project.id fails", () => {
  const bp = base(); bp.project.id = "nope"
  const { failed } = extendedRules(bp, {}, { level: "L6", schemaSections: SECTIONS })
  assert.ok(failed.some((f) => f.rule === "VAL-050"))
})

test("VAL-051: undeclared section fails", () => {
  const bp = base(); bp.wat = { x: 1 }
  const { failed } = extendedRules(bp, {}, { level: "L6", schemaSections: SECTIONS })
  assert.ok(failed.some((f) => f.rule === "VAL-051" && f.path === "wat"))
})

test("VAL-051: x- extension allowed", () => {
  const bp = base(); bp["x-custom"] = { x: 1 }
  const { failed } = extendedRules(bp, {}, { level: "L6", schemaSections: SECTIONS })
  assert.ok(!failed.some((f) => f.rule === "VAL-051"))
})

test("VAL-060: placeholder text fails, but format strings do not", () => {
  const bp = base(); bp.requirements.explicit[0].description = "handle the TODO later"
  let r = extendedRules(bp, {}, { level: "L6", schemaSections: SECTIONS })
  assert.ok(r.failed.some((f) => f.rule === "VAL-060"))

  const bp2 = base(); bp2.requirements.explicit[0].description = "cite discovery/<domain>/<rule-id> format"
  r = extendedRules(bp2, {}, { level: "L6", schemaSections: SECTIONS })
  assert.ok(!r.failed.some((f) => f.rule === "VAL-060"), "slash-prefixed <token> is not a placeholder")
})

test("VAL-061: non-GWT acceptance criterion fails", () => {
  const bp = base(); bp.requirements.explicit[0]["acceptance-criteria"] = ["it should just work"]
  const { failed } = extendedRules(bp, {}, { level: "L6", schemaSections: SECTIONS })
  assert.ok(failed.some((f) => f.rule === "VAL-061"))
})

test("VAL-063: near-duplicate requirements fail", () => {
  const bp = base()
  bp.requirements.explicit.push({ id: "REQ-002", title: "Login", description: "user can log in", "acceptance-criteria": ["Given a user, When they submit valid creds, Then a session starts"] })
  const { failed } = extendedRules(bp, {}, { level: "L6", schemaSections: SECTIONS })
  assert.ok(failed.some((f) => f.rule === "VAL-063"))
})

test("VAL-054: dangling stage dependency fails", () => {
  const filesMap = {
    "01.yaml": { _meta: { stage: "stage-01", depends_on: [] } },
    "02.yaml": { _meta: { stage: "stage-02", depends_on: ["stage-99"] } },
  }
  const { failed } = extendedRules(base(), filesMap, { level: "L6", schemaSections: SECTIONS })
  assert.ok(failed.some((f) => f.rule === "VAL-054"))
})
