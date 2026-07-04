import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { mergeStagedFiles } from "../src/commands/build.js"

function stagedDir(files) {
  const dir = mkdtempSync(join(tmpdir(), "awp-agg-"))
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content)
  return dir
}

test("merges root + dependent workflows without losing the root", () => {
  const dir = stagedDir({
    "04-root-models.yaml": "_meta: {blueprint_id: BLU-T}\nworkflows:\n  root: {id: WF-1, name: R, steps: []}\nsecurity: {authentication: required}\n",
    "05-dependent-models.yaml": "workflows:\n  dependent:\n    - {id: WF-2, name: D, steps: []}\naudit: {events: []}\n",
  })
  const { doc, collisions, files } = mergeStagedFiles(dir)
  assert.equal(files.length, 2)
  assert.equal(collisions.length, 0)
  assert.equal(doc.workflows.root.id, "WF-1")
  assert.equal(doc.workflows.dependent[0].id, "WF-2")
  assert.ok(doc.security && doc.audit, "non-workflow sections are unioned")
  rmSync(dir, { recursive: true, force: true })
})

test("detects an id collision across staged files", () => {
  const dir = stagedDir({
    "03-a.yaml": "actors:\n  - {id: ACT-1, name: A}\n",
    "04-b.yaml": "roles:\n  - {id: ACT-1, name: B}\n",
  })
  const { collisions } = mergeStagedFiles(dir)
  assert.equal(collisions.length, 1)
  assert.equal(collisions[0].id, "ACT-1")
  rmSync(dir, { recursive: true, force: true })
})

test("strips per-file _meta and stamps aggregate provenance", () => {
  const dir = stagedDir({
    "01-x.yaml": "_meta: {blueprint_id: BLU-T, stage: stage-01}\nproject: {id: BLU-T}\n",
  })
  const { doc } = mergeStagedFiles(dir)
  assert.ok(doc._meta.aggregated_from.includes("01-x.yaml"))
  assert.equal(doc.project.id, "BLU-T")
  rmSync(dir, { recursive: true, force: true })
})
