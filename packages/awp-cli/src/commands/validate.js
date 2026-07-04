import { existsSync, readFileSync } from "node:fs"
import { join, relative, isAbsolute } from "node:path"
import YAML from "yaml"
import { requireRepoRoot, listFiles, tryReadYaml } from "../lib/repo.js"
import { validateBlueprint } from "../validate.js"

/**
 * awp validate — Node port of the .tools/*.sh validators so the suite is
 * cross-platform and dogfooded in CI.
 *
 * Checks: spec (YAML syntax + registry resolution + constitution),
 * gates (G1-G5 mandatory/human), adapters (drift markers), memory (7 tiers),
 * trace (project artifacts carry trace/source), secrets (Constitution C5).
 */
export async function validate(flags) {
  const root = requireRepoRoot()

  // Blueprint mode: `awp validate <blueprint-dir|blueprint.yaml>` runs the
  // deterministic rule engine (validate.js). No positional arg → platform-OS
  // validation (below), preserving v0.1 behavior.
  if (flags._ && flags._.length > 0) {
    return validateBlueprintCli(root, flags)
  }

  const only = typeof flags.only === "string" ? flags.only.split(",").map((s) => s.trim()) : null
  const checks = {
    spec: checkSpec,
    gates: checkGates,
    adapters: checkAdapters,
    memory: checkMemory,
    trace: checkTrace,
    secrets: checkSecrets,
  }

  let failed = 0
  for (const [name, fn] of Object.entries(checks)) {
    if (only && !only.includes(name)) continue
    const issues = fn(root)
    if (issues.fatal.length === 0) {
      console.log(`PASS  ${name}${issues.notes.length ? ` (${issues.notes.length} note${issues.notes.length > 1 ? "s" : ""})` : ""}`)
    } else {
      failed++
      console.log(`FAIL  ${name}`)
      for (const f of issues.fatal) console.log(`      ! ${f}`)
    }
    for (const n of issues.notes) console.log(`      ~ ${n}`)
  }

  if (failed > 0) {
    console.log(`\nawp validate: FAIL (${failed} check${failed > 1 ? "s" : ""} failed)`)
    return 1
  }
  console.log("\nawp validate: PASS")
  return 0
}

/**
 * Blueprint-mode validation: run the deterministic rule engine against a
 * staged directory or a monolithic blueprint.yaml, and print the coverage
 * report (§5.4 format). Exits non-zero on any failed rule so it can gate CI
 * and the DRAFT-INVALID → repair → re-validate loop.
 */
async function validateBlueprintCli(root, flags) {
  const target = flags._[0]
  const targetPath = isAbsolute(target) ? target : join(root, target)
  if (!existsSync(targetPath)) {
    console.error(`awp validate: path not found: ${targetPath}`)
    return 1
  }

  const story = typeof flags.story === "string" ? flags.story : ""
  const level = typeof flags.level === "string" ? flags.level.toUpperCase() : "L6"

  const { passed, failed } = validateBlueprint(root, targetPath, { story, level })
  const total = passed.length + failed.length

  if (failed.length === 0) {
    console.log(`✓ Validation: ${total}/${total} rules passed (deterministic)`)
    return 0
  }

  console.log(`✗ Validation: ${passed.length}/${total} rules passed`)
  console.log("")
  console.log("FAILED RULES")
  for (const f of failed) {
    console.log(`  ${f.rule.padEnd(8)} ${String(f.file).padEnd(26)} ${String(f.path).padEnd(40)} → ${f.hint}`)
  }
  console.log(`\nStatus: DRAFT-INVALID (fix the above, then re-run awp validate)`)
  return 1
}

const OS_DIRS = [".ai", ".agents", ".governance", ".skills", ".templates", ".memory", ".commands"]

function checkSpec(root) {
  const fatal = []
  const notes = []

  for (const dir of OS_DIRS) {
    const files = listFiles(join(root, dir), (f) => f.endsWith(".yaml"))
    for (const f of files) {
      try {
        YAML.parse(readFileSync(f, "utf8"))
      } catch (err) {
        fatal.push(`invalid YAML: ${relative(root, f)} — ${err.message.split("\n")[0]}`)
      }
    }
  }

  const skillsReg = tryReadYaml(join(root, ".skills/registry.yaml"))
  for (const s of (skillsReg && skillsReg.skills) || []) {
    if (s.spec && !existsSync(join(root, s.spec))) notes.push(`skill spec not materialized: ${s.spec}`)
  }
  const tplReg = tryReadYaml(join(root, ".templates/registry.yaml"))
  for (const t of (tplReg && tplReg.templates) || []) {
    if (t.path && !existsSync(join(root, t.path))) notes.push(`template not materialized: ${t.path}`)
  }

  const constitution = join(root, ".ai/constitution.md")
  if (!existsSync(constitution) || !readFileSync(constitution, "utf8").includes("status: active")) {
    fatal.push("constitution missing or not active (.ai/constitution.md)")
  }

  return { fatal, notes }
}

function checkGates(root) {
  const fatal = []
  const notes = []
  const gates = ["G1-requirements", "G2-architecture", "G3-data-model", "G4-security", "G5-release"]

  for (const g of gates) {
    const f = join(root, `.governance/gates/${g}.yaml`)
    if (!existsSync(f)) {
      fatal.push(`missing mandatory gate: .governance/gates/${g}.yaml (Constitution R3)`)
      continue
    }
    const text = readFileSync(f, "utf8")
    if (!text.includes("mandatory: true")) fatal.push(`gate ${g} must be mandatory (R3)`)
    if (!text.includes("approver: human")) fatal.push(`gate ${g} approver must be human (R1)`)
  }

  for (const extra of ["assignments.yaml", "transitions.yaml"]) {
    if (!existsSync(join(root, `.governance/gates/${extra}`))) fatal.push(`missing .governance/gates/${extra}`)
  }

  const agentFiles = listFiles(join(root, ".agents"), (f) => f.endsWith(".yaml") || f.endsWith(".md"))
  for (const f of agentFiles) {
    if (readFileSync(f, "utf8").includes("mayApprove: true")) {
      fatal.push(`agent declares approval authority: ${relative(root, f)} (Constitution R1)`)
    }
  }

  return { fatal, notes }
}

function checkAdapters(root) {
  const fatal = []
  const notes = []
  const adapters = ["CLAUDE.md", "AGENTS.md", "opencode.json", ".github/copilot-instructions.md"]

  for (const a of adapters) {
    const f = join(root, a)
    if (!existsSync(f)) {
      fatal.push(`missing adapter: ${a}`)
      continue
    }
    const text = readFileSync(f, "utf8")
    if (!/generated/i.test(text) && !text.includes("_generated")) {
      fatal.push(`adapter drift: ${a} missing generated marker — regenerate from .ai/manifest.yaml`)
    }
  }

  return { fatal, notes }
}

function checkMemory(root) {
  const fatal = []
  const notes = []
  const tiers = ["strategic", "domain", "pattern", "decision", "project", "session", "failure"]

  for (const t of tiers) {
    if (!existsSync(join(root, `.memory/${t}`))) fatal.push(`missing memory tier: .memory/${t} (Constitution P5)`)
  }
  const indexPath = join(root, ".memory/index.yaml")
  if (!existsSync(indexPath)) {
    fatal.push("missing .memory/index.yaml")
    return { fatal, notes }
  }

  // The top-level index may delegate subdirectories to their own index.yaml
  // (e.g. `index: .memory/domain-knowledge/index.yaml`). Honor those
  // delegations: a file is "indexed" if it appears in the top-level index OR
  // in the sub-index responsible for its directory.
  const index = readFileSync(indexPath, "utf8")
  const subIndexes = listFiles(join(root, ".memory"), (f) => f.endsWith("/index.yaml"))
  const indexByDir = new Map()
  for (const si of subIndexes) {
    indexByDir.set(si.slice(0, si.lastIndexOf("/")), readFileSync(si, "utf8"))
  }

  const files = listFiles(join(root, ".memory"), (f) => (f.endsWith(".md") || f.endsWith(".yaml")) && !f.endsWith("index.yaml"))
  for (const f of files) {
    const base = f.split("/").pop()
    if (base === "README.md") continue
    if (index.includes(base)) continue
    // walk up parent dirs looking for a delegated sub-index that lists the file
    let dir = f.slice(0, f.lastIndexOf("/"))
    let indexed = false
    while (dir.length >= join(root, ".memory").length) {
      const sub = indexByDir.get(dir)
      if (sub && sub.includes(base)) {
        indexed = true
        break
      }
      dir = dir.slice(0, dir.lastIndexOf("/"))
    }
    if (!indexed) notes.push(`unindexed memory: ${relative(root, f)}`)
  }

  return { fatal, notes }
}

function checkTrace(root) {
  const fatal = []
  const notes = []
  const target = join(root, ".memory/project")
  const files = listFiles(target, (f) => (f.endsWith(".yaml") || f.endsWith(".md")) && !f.endsWith("README.md"))

  for (const f of files) {
    const text = readFileSync(f, "utf8")
    if (!/(trace:|source:)/.test(text)) fatal.push(`broken trace: ${relative(root, f)} has no trace/source block (Constitution R4)`)
  }

  return { fatal, notes }
}

function checkSecrets(root) {
  const fatal = []
  const notes = []
  const pattern = /(password|secret|api[_-]?key)\s*[:=]\s*['"][^'"]{8,}/i

  for (const dir of OS_DIRS) {
    const files = listFiles(join(root, dir), (f) => /\.(ya?ml|md|json)$/.test(f))
    for (const f of files) {
      const lines = readFileSync(f, "utf8").split("\n")
      lines.forEach((line, i) => {
        if (pattern.test(line)) fatal.push(`potential secret: ${relative(root, f)}:${i + 1} (Constitution C5)`)
      })
    }
  }

  return { fatal, notes }
}
