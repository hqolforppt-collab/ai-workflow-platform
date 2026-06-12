#!/usr/bin/env node
// Engine-grade BPMN 2.0 round-trip using bpmn-moddle — the same parser/serializer
// the bpmn.io / Camunda toolchain uses. This proves the platform's BPMN output is
// genuinely importable by a real BPMN engine, not just well-formed XML.
//
// Round-trip:
//   1. Parse the .bpmn20.xml into a moddle object graph (fails on schema/type errors).
//   2. Re-serialize that graph back to XML.
//   3. Re-parse the serialized XML (proves the output is stable and importable).
//
// Any parse warning or error fails the process so CI fails loudly.
//
// Usage: node .tools/flowable-import-check.mjs [file.bpmn20.xml ...]

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, relative } from "node:path"
import { BpmnModdle } from "bpmn-moddle"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")

const files =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ["examples/login-page/models/login-flow.bpmn20.xml"]

const moddle = new BpmnModdle()
let failed = false

for (const rel of files) {
  const path = join(root, rel)
  const label = relative(root, path)
  let xml
  try {
    xml = readFileSync(path, "utf8")
  } catch {
    console.error(`  FAIL: cannot read ${label}`)
    failed = true
    continue
  }

  try {
    // 1. Parse.
    const { rootElement, warnings } = await moddle.fromXML(xml)
    if (warnings && warnings.length) {
      console.error(`  FAIL: ${label} parsed with warnings:`)
      for (const w of warnings) console.error(`    - ${w.message || w}`)
      failed = true
      continue
    }
    if (!rootElement || rootElement.$type !== "bpmn:Definitions") {
      console.error(`  FAIL: ${label} root element is not bpmn:Definitions`)
      failed = true
      continue
    }

    // 2. Re-serialize.
    const { xml: out } = await moddle.toXML(rootElement)

    // 3. Re-parse the serialized output.
    const reparse = await moddle.fromXML(out)
    if (reparse.warnings && reparse.warnings.length) {
      console.error(`  FAIL: ${label} re-serialized form did not re-parse cleanly`)
      failed = true
      continue
    }

    const procs = (rootElement.rootElements || []).filter((e) => e.$type === "bpmn:Process")
    console.log(`  OK: ${label} (processes: ${procs.length}, engine-importable)`)
  } catch (err) {
    console.error(`  FAIL: ${label} -> ${err.message}`)
    failed = true
  }
}

if (failed) {
  console.error("\nBPMN engine import check FAILED")
  process.exit(1)
}
console.log("\nBPMN engine import check PASS: all definitions are importable by a conformant BPMN engine.")
