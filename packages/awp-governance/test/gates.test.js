import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { checkGates, checkRuntimeMutation, resolveBlueprintId } from "../src/index.js"

function tmpRepo() {
  const root = mkdtempSync(join(tmpdir(), "awp-gov-"))
  mkdirSync(join(root, ".governance"), { recursive: true })
  return root
}

function writeApproval(root, id, gate, status) {
  const dir = join(root, ".governance", "approvals", id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${gate}.yaml`), `status: ${status}\n`)
}

test("checkGates refuses when no approvals exist (fail-closed)", () => {
  const root = tmpRepo()
  const r = checkGates(root, { blueprintId: "BLU-X" })
  assert.equal(r.ok, false)
  assert.deepEqual(r.missing, ["G1", "G2", "G3", "G4"])
  rmSync(root, { recursive: true, force: true })
})

test("checkGates passes only when all four are approved", () => {
  const root = tmpRepo()
  for (const g of ["G1", "G2", "G3", "G4"]) writeApproval(root, "BLU-X", g, "approved")
  const r = checkGates(root, { blueprintId: "BLU-X" })
  assert.equal(r.ok, true)
  assert.deepEqual(r.approved, ["G1", "G2", "G3", "G4"])
  rmSync(root, { recursive: true, force: true })
})

test("checkGates reports an unapproved gate", () => {
  const root = tmpRepo()
  for (const g of ["G1", "G2", "G3"]) writeApproval(root, "BLU-X", g, "approved")
  writeApproval(root, "BLU-X", "G4", "pending")
  const r = checkGates(root, { blueprintId: "BLU-X" })
  assert.equal(r.ok, false)
  assert.deepEqual(r.unapproved, ["G4"])
  rmSync(root, { recursive: true, force: true })
})

test("checkRuntimeMutation is blocked without an id or the env escape hatch", () => {
  const root = tmpRepo()
  delete process.env.AWP_ALLOW_RUNTIME_MUTATION
  const r = checkRuntimeMutation(root, {})
  assert.equal(r.ok, false)
  rmSync(root, { recursive: true, force: true })
})

test("checkRuntimeMutation is allowed via the explicit env escape hatch", () => {
  const root = tmpRepo()
  process.env.AWP_ALLOW_RUNTIME_MUTATION = "1"
  const r = checkRuntimeMutation(root, {})
  assert.equal(r.ok, true)
  delete process.env.AWP_ALLOW_RUNTIME_MUTATION
  rmSync(root, { recursive: true, force: true })
})

test("checkRuntimeMutation is allowed for a fully-approved blueprint id", () => {
  const root = tmpRepo()
  delete process.env.AWP_ALLOW_RUNTIME_MUTATION
  for (const g of ["G1", "G2", "G3", "G4"]) writeApproval(root, "BLU-X", g, "approved")
  const r = checkRuntimeMutation(root, { blueprintId: "BLU-X" })
  assert.equal(r.ok, true)
  rmSync(root, { recursive: true, force: true })
})

test("resolveBlueprintId derives an id from a directory name", () => {
  assert.equal(resolveBlueprintId("blueprints/login-and-registration"), "BLU-LOGIN-AND-REGISTRATION")
})
