/**
 * flowable-generators.test.js — the DMN and Form generators must produce
 * engine-conformant output (DMN 1.3 decision tables, Flowable FormModel JSON),
 * not the earlier stubs. These are pure/offline checks; the live-engine deploy
 * is proven by the BPMN round-trip CI job.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { yamlToDmn, yamlToFormJson } from "../src/commands/flowable.js"

const DEC = {
  id: "DEC-001",
  name: "Approval Routing",
  "hit-policy": "FIRST",
  inputs: [
    { id: "input1", label: "Amount", expression: "gross_minor", type: "number" },
    { id: "input2", label: "Dept", expression: "department", type: "string" },
    { id: "input3", label: "Risk", expression: "vendor_risk", type: "string" },
  ],
  outputs: [
    { id: "output1", label: "Role", name: "approver-role", type: "string" },
    { id: "output2", label: "Four-eyes", name: "requires-four-eyes", type: "boolean" },
  ],
  rules: [
    { id: "R1", when: "vendor_risk = 'high' and gross_minor >= 5000000", then: "approver-role = 'ROLE-CFO', requires-four-eyes = true" },
    { id: "R5", when: "otherwise", then: "approver-role = 'ROLE-APPROVER', requires-four-eyes = false" },
  ],
}

test("DMN: emits a typed DMN 1.3 decision table with hitPolicy", () => {
  const xml = yamlToDmn(DEC, "dec")
  assert.match(xml, /spec\/DMN\/20191111\/MODEL/)
  assert.match(xml, /<decisionTable id="DEC-001-table" hitPolicy="FIRST">/)
  assert.match(xml, /<inputExpression id="input1_expr" typeRef="number">\s*<text>gross_minor<\/text>/)
  assert.match(xml, /<output id="output2" label="Four-eyes" name="requires-four-eyes" typeRef="boolean"\/>/)
})

test("DMN: a compound `when` decomposes into one unary test per input column", () => {
  const xml = yamlToDmn(DEC, "dec")
  // R1: gross_minor >= 5000000 (col1), department any (col2, '-'), vendor_risk = 'high' (col3)
  const r1 = xml.slice(xml.indexOf('<rule id="R1">'), xml.indexOf("</rule>"))
  const entries = [...r1.matchAll(/<inputEntry><text>(.*?)<\/text><\/inputEntry>/g)].map((m) => m[1])
  assert.deepEqual(entries, ["&gt;= 5000000", "-", '"high"'])
  const outs = [...r1.matchAll(/<outputEntry><text>(.*?)<\/text><\/outputEntry>/g)].map((m) => m[1])
  assert.deepEqual(outs, ['"ROLE-CFO"', "true"])
})

test("DMN: `otherwise` becomes an all-any catch-all row", () => {
  const xml = yamlToDmn(DEC, "dec")
  const r5 = xml.slice(xml.indexOf('<rule id="R5">'), xml.lastIndexOf("</rule>") + 8)
  const entries = [...r5.matchAll(/<inputEntry><text>(.*?)<\/text><\/inputEntry>/g)].map((m) => m[1])
  assert.deepEqual(entries, ["-", "-", "-"])
})

test("DMN: a single bare-outcome `then` fills the one output column", () => {
  const dec = {
    id: "D",
    inputs: [{ expression: "ip", type: "string" }],
    outputs: [{ name: "action", type: "string" }],
    rules: [{ when: "ip = 'tor'", then: "block-and-alert" }],
  }
  const xml = yamlToDmn(dec, "d")
  assert.match(xml, /<inputEntry><text>"tor"<\/text><\/inputEntry>/)
  assert.match(xml, /<outputEntry><text>"block-and-alert"<\/text><\/outputEntry>/)
})

test("Form: emits a Flowable FormModel with mapped field types", () => {
  const form = {
    id: "FRM-001",
    name: "Registration",
    fields: [
      { name: "email", label: "Email", type: "email", required: true },
      { name: "consent", label: "Consent", type: "checkbox", required: true },
      { name: "bio", label: "Bio", type: "textarea", required: false },
    ],
  }
  const m = yamlToFormJson(form, "frm")
  assert.equal(m.key, "FRM-001")
  assert.ok(Array.isArray(m.fields) && Array.isArray(m.outcomes))
  assert.equal(m.fields[0].type, "text") // email → text
  assert.equal(m.fields[1].type, "boolean") // checkbox → boolean
  assert.equal(m.fields[2].type, "multi-line-text") // textarea → multi-line-text
  assert.equal(m.fields[2].required, false)
  assert.equal(m.fields[0].id, "email")
})
