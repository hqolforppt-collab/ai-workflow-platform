/**
 * gates.js — fail-closed G1-G4 gate enforcement.
 *
 * ONE gate check, imported by every mutating path (CLI `awp flowable deploy`
 * and the Flowable MCP `deploy`/`start_process`/`complete_task` tools). This is
 * the shared module the v2.0 audit found missing: the CLI had a private,
 * fail-OPEN copy and the MCP server had none, so any MCP client could deploy an
 * ungated blueprint to a live engine (Constitution R2 violation).
 *
 * Design decisions grounded in the repo:
 *   - `.governance/gates/G{n}-*.yaml` are gate DEFINITIONS (policy: mandatory,
 *     approver: human). They are NOT approval records and never carry
 *     `status: approved`. Reading them for approval — as the old CLI did — can
 *     never pass. Approval records are per-blueprint.
 *   - Per-blueprint approval records are resolved, in order, from:
 *       1. <blueprintDir>/gates/G{n}.yaml            (co-located with output)
 *       2. .governance/approvals/<blueprintId>/G{n}.yaml
 *     Each must exist and carry status "approved".
 *   - FAIL CLOSED: a missing record, an unreadable record, or a missing
 *     blueprint id all mean REFUSE. The only ungated path is a dry-run
 *     (validate), which never calls this module.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, basename } from "node:path"
import YAML from "yaml"

/** Canonical G1-G4 gate ids and the definition file that names each. */
export const REQUIRED_GATES = [
  { id: "G1", def: "G1-requirements" },
  { id: "G2", def: "G2-architecture" },
  { id: "G3", def: "G3-data-model" },
  { id: "G4", def: "G4-security" },
]

function readYamlSafe(path) {
  try {
    return YAML.parse(readFileSync(path, "utf8"))
  } catch {
    return null
  }
}

/**
 * Resolve a blueprint id from a blueprint directory.
 * Order: deploy-manifest.json → _meta.blueprint_id in any staged file →
 * derived BLU-<DIRNAME>. Returns null only when `bpDir` is falsy.
 */
export function resolveBlueprintId(bpDir) {
  if (!bpDir) return null

  // 1. flowable/deploy-manifest.json (or a manifest at the dir root)
  for (const manifestPath of [
    join(bpDir, "flowable", "deploy-manifest.json"),
    join(bpDir, "deploy-manifest.json"),
  ]) {
    if (existsSync(manifestPath)) {
      const m = readYamlSafe(manifestPath)
      if (m && m.blueprint_id) return m.blueprint_id
    }
  }

  // 2. _meta.blueprint_id in any staged file
  if (existsSync(bpDir)) {
    let entries = []
    try {
      entries = readdirSync(bpDir).filter((f) => /^\d{2}-.*\.ya?ml$/.test(f) || f === "blueprint.yaml")
    } catch {
      entries = []
    }
    for (const entry of entries.sort()) {
      const doc = readYamlSafe(join(bpDir, entry))
      const id = doc?._meta?.blueprint_id || doc?.project?.id
      if (id) return id
    }
  }

  // 3. derive from directory name
  return "BLU-" + basename(bpDir).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

/** Candidate directories that may hold per-blueprint approval records. */
function approvalDirs(root, bpDir, blueprintId) {
  const dirs = []
  if (bpDir) dirs.push(join(bpDir, "gates"))
  if (blueprintId) dirs.push(join(root, ".governance", "approvals", blueprintId))
  return dirs
}

function readApprovalStatus(record) {
  if (!record || typeof record !== "object") return null
  return record.status || record.approval?.status || record.gate?.status || null
}

/**
 * Check that all of G1-G4 are approved for a blueprint.
 *
 * @param {string} root — repo root
 * @param {object} opts
 * @param {string} [opts.bpDir] — blueprint output directory (approval records may sit in <bpDir>/gates)
 * @param {string} [opts.blueprintId] — blueprint id; if omitted and bpDir is given, it is resolved
 * @returns {{ok:boolean, approved:string[], missing:string[], unapproved:string[], blueprintId:string|null, summary:string, reason:string}}
 */
export function checkGates(root, opts = {}) {
  const bpDir = opts.bpDir || null
  const blueprintId = opts.blueprintId || (bpDir ? resolveBlueprintId(bpDir) : null)

  const approved = []
  const missing = []
  const unapproved = []

  const dirs = approvalDirs(root, bpDir, blueprintId)

  for (const gate of REQUIRED_GATES) {
    let status = null
    let found = false
    for (const dir of dirs) {
      for (const fname of [`${gate.id}.yaml`, `${gate.id}.yml`, `${gate.def}.yaml`]) {
        const p = join(dir, fname)
        if (existsSync(p)) {
          status = readApprovalStatus(readYamlSafe(p))
          found = true
          break
        }
      }
      if (found) break
    }
    if (!found) missing.push(gate.id)
    else if (status === "approved") approved.push(gate.id)
    else unapproved.push(gate.id)
  }

  const ok = missing.length === 0 && unapproved.length === 0
  const reasonParts = []
  if (missing.length) reasonParts.push(`no approval record for: ${missing.join(", ")}`)
  if (unapproved.length) reasonParts.push(`not approved: ${unapproved.join(", ")}`)

  return {
    ok,
    approved,
    missing,
    unapproved,
    blueprintId,
    summary: ok ? REQUIRED_GATES.map((g) => `${g.id}✓`).join(" ") : "",
    reason: ok
      ? ""
      : `blueprint ${blueprintId || "(unresolved id)"}: ${reasonParts.join("; ")}. ` +
        `Add approved records to <blueprint>/gates/G{1..4}.yaml or .governance/approvals/${blueprintId || "<id>"}/.`,
  }
}

/**
 * Guard for runtime engine mutation (start_process / complete_task). These act
 * on already-deployed definitions, so a blueprint id may not be resolvable.
 * Allowed only when EITHER an explicit escape hatch is set OR the named
 * blueprint is fully gate-approved. Fail closed otherwise.
 *
 * @returns {{ok:boolean, reason:string, via:string}}
 */
export function checkRuntimeMutation(root, opts = {}) {
  if (process.env.AWP_ALLOW_RUNTIME_MUTATION === "1") {
    return { ok: true, reason: "", via: "AWP_ALLOW_RUNTIME_MUTATION=1" }
  }
  const blueprintId = opts.blueprintId || null
  if (!blueprintId) {
    return {
      ok: false,
      via: "",
      reason:
        "runtime mutation blocked: no blueprint_id to gate-check. " +
        "Pass blueprint_id, or set AWP_ALLOW_RUNTIME_MUTATION=1 to allow explicitly.",
    }
  }
  const gate = checkGates(root, { blueprintId })
  if (gate.ok) return { ok: true, reason: "", via: `gates ${gate.summary}` }
  return { ok: false, via: "", reason: gate.reason }
}
