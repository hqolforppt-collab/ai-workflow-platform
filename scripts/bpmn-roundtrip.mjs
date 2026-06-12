#!/usr/bin/env node
/**
 * BPMN round-trip proof (Gap 4, GAP-FULFILLMENT-ROADMAP).
 *
 * Proves the platform's BPMN output is engine-valid structured BPMN 2.0,
 * not just internal pseudo-YAML, by asserting three properties:
 *
 *   1. PARSE      — every *.bpmn20.xml parses as BPMN 2.0 via bpmn-moddle
 *                   with zero warnings.
 *   2. ROUND-TRIP — parse -> serialize -> re-parse yields a structurally
 *                   identical model (same element ids, types, and sequence
 *                   flow topology). Nothing is lost or mutated in transit.
 *   3. SYNC       — every step declared in the canonical AWP YAML model
 *                   (*.bpmn) exists as a flow element in the BPMN 2.0 XML,
 *                   so the two renderings cannot silently drift apart.
 *
 * Usage: node scripts/bpmn-roundtrip.mjs
 * Exits non-zero on any failure. Run by .github/workflows/bpmn-roundtrip.yml.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, dirname, basename } from "node:path"
import { fileURLToPath } from "node:url"
import { BpmnModdle } from "bpmn-moddle"
import { parse as parseYaml } from "yaml"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const moddle = new BpmnModdle()

let failures = 0
const fail = (msg) => {
  failures++
  console.error(`  FAIL  ${msg}`)
}
const pass = (msg) => console.log(`  PASS  ${msg}`)

/** Recursively find files matching a predicate, skipping node_modules. */
function findFiles(dir, predicate, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".git")) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) findFiles(full, predicate, out)
    else if (predicate(full)) out.push(full)
  }
  return out
}

/** Flatten a bpmn-moddle definitions tree into { id -> $type } plus flow topology. */
function structuralSignature(definitions) {
  const elements = new Map()
  const flows = []

  const visit = (el) => {
    if (!el || typeof el !== "object") return
    if (el.id && el.$type) {
      elements.set(el.id, el.$type)
      if (el.$type === "bpmn:SequenceFlow") {
        flows.push(`${el.sourceRef?.id ?? "?"}->${el.targetRef?.id ?? "?"}`)
      }
    }
    for (const key of Object.keys(el)) {
      if (key.startsWith("$")) continue
      const val = el[key]
      if (Array.isArray(val)) val.forEach(visit)
      else if (val && typeof val === "object" && val.$type) visit(val)
    }
  }

  visit(definitions)
  return { elements, flows: flows.sort() }
}

async function roundTrip(xmlPath) {
  const name = basename(xmlPath)
  const original = readFileSync(xmlPath, "utf8")

  // 1. PARSE
  const first = await moddle.fromXML(original)
  if (first.warnings?.length) {
    fail(`${name}: parse produced ${first.warnings.length} warning(s): ${first.warnings.map((w) => w.message).join("; ")}`)
    return null
  }
  pass(`${name}: parses as BPMN 2.0 with zero warnings`)

  // 2. ROUND-TRIP
  const { xml: reserialized } = await moddle.toXML(first.rootElement, { format: true })
  const second = await moddle.fromXML(reserialized)
  if (second.warnings?.length) {
    fail(`${name}: re-parse after serialization produced warnings`)
    return null
  }

  const a = structuralSignature(first.rootElement)
  const b = structuralSignature(second.rootElement)

  const missing = [...a.elements.keys()].filter((id) => !b.elements.has(id))
  const added = [...b.elements.keys()].filter((id) => !a.elements.has(id))
  const typeDrift = [...a.elements.keys()].filter((id) => b.elements.has(id) && b.elements.get(id) !== a.elements.get(id))

  if (missing.length) fail(`${name}: round-trip lost elements: ${missing.join(", ")}`)
  if (added.length) fail(`${name}: round-trip invented elements: ${added.join(", ")}`)
  if (typeDrift.length) fail(`${name}: round-trip changed element types: ${typeDrift.join(", ")}`)
  if (JSON.stringify(a.flows) !== JSON.stringify(b.flows)) {
    fail(`${name}: round-trip changed sequence flow topology`)
  }

  if (!missing.length && !added.length && !typeDrift.length) {
    pass(`${name}: round-trip preserves all ${a.elements.size} elements and ${a.flows.length} flows`)
  }

  return a
}

function checkYamlSync(yamlPath, signature) {
  const name = basename(yamlPath)
  const doc = parseYaml(readFileSync(yamlPath, "utf8"))
  const steps = Array.isArray(doc?.steps) ? doc.steps : []
  if (!steps.length) {
    fail(`${name}: canonical model declares no steps`)
    return
  }

  const missing = steps.map((s) => s.id).filter((id) => id && !signature.elements.has(id))
  if (missing.length) {
    fail(`${name}: steps missing from BPMN 2.0 XML: ${missing.join(", ")} — regenerate the .bpmn20.xml`)
  } else {
    pass(`${name}: all ${steps.length} canonical steps present in BPMN 2.0 XML`)
  }
}

const xmlFiles = findFiles(root, (f) => f.endsWith(".bpmn20.xml"))
if (!xmlFiles.length) {
  console.error("FAIL  no *.bpmn20.xml files found — nothing to round-trip")
  process.exit(1)
}

console.log(`bpmn-roundtrip: checking ${xmlFiles.length} model(s)\n`)

for (const xmlPath of xmlFiles) {
  const signature = await roundTrip(xmlPath)
  if (!signature) continue

  // canonical AWP YAML model lives next to the XML: foo.bpmn20.xml <-> foo.bpmn
  const yamlPath = xmlPath.replace(/\.bpmn20\.xml$/, ".bpmn")
  try {
    statSync(yamlPath)
    checkYamlSync(yamlPath, signature)
  } catch {
    console.log(`  SKIP  ${basename(yamlPath)}: no canonical YAML model alongside XML`)
  }
}

console.log(`\nbpmn-roundtrip: ${failures === 0 ? "PASS" : `FAIL (${failures} failure(s))`}`)
process.exit(failures === 0 ? 0 : 1)
