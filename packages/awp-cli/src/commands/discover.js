import { existsSync } from "node:fs"
import { join, relative } from "node:path"
import YAML from "yaml"
import { requireRepoRoot, tryReadYaml, listFiles } from "../lib/repo.js"

const MODEL_EXT = {
  bpmn: [".bpmn", ".bpmn20.xml"],
  cmmn: [".cmmn"],
  dmn: [".dmn"],
  form: [".form"],
}

/**
 * awp discover — scan the repository and report inventory of skills, templates,
 * commands, agents, workflows, and Flowable models, plus registry entries whose
 * files are missing on disk.
 */
export async function discover(flags) {
  const root = requireRepoRoot()
  const output = flags.output || "text"
  const filter = typeof flags.model === "string" ? flags.model : null
  const skillsOnly = Boolean(flags["skills-only"])

  const inventory = {
    skills: collectRegistry(root, ".skills/registry.yaml", "skills", "spec"),
    templates: collectRegistry(root, ".templates/registry.yaml", "templates", "path"),
    commands: collectCommands(root),
    agents: collectDirEntries(root, ".agents"),
    workflows: collectDirEntries(root, ".workflows"),
    models: collectModels(root),
    domainPacks: collectDomainPacks(root),
  }

  const missing = [
    ...inventory.skills.missing.map((m) => `skill: ${m}`),
    ...inventory.templates.missing.map((m) => `template: ${m}`),
    ...inventory.commands.missing.map((m) => `command: ${m}`),
  ]

  let result = {
    skills: inventory.skills.count,
    templates: inventory.templates.count,
    commands: inventory.commands.count,
    agents: inventory.agents,
    workflows: inventory.workflows,
    domainPacks: inventory.domainPacks,
    models: inventory.models,
    missing,
  }

  if (skillsOnly) result = { skills: inventory.skills.count, missing: inventory.skills.missing }
  if (filter && MODEL_EXT[filter]) result = { models: { [filter]: inventory.models[filter] ?? 0 } }
  if (filter && !MODEL_EXT[filter]) {
    const key = `${filter}s`
    if (key in result) result = { [key]: result[key], missing: missing.filter((m) => m.startsWith(filter)) }
  }

  if (output === "json") console.log(JSON.stringify(result, null, 2))
  else if (output === "yaml") console.log(YAML.stringify(result))
  else printText(result)

  return missing.length > 0 && flags.strict ? 1 : 0
}

function collectRegistry(root, registryRel, key, pathField) {
  const reg = tryReadYaml(join(root, registryRel))
  const entries = (reg && reg[key]) || []
  const missing = []
  for (const e of entries) {
    const rel = e[pathField]
    if (rel && !existsSync(join(root, rel))) missing.push(e.id || rel)
  }
  return { count: entries.length, missing }
}

function collectCommands(root) {
  const reg = tryReadYaml(join(root, ".commands/registry.yaml"))
  const entries = (reg && reg.commands) || []
  const missing = []
  for (const e of entries) {
    if (e.spec && !existsSync(join(root, e.spec))) missing.push(e.id || e.spec)
    if (e.tooling && !existsSync(join(root, e.tooling))) missing.push(`${e.id} tooling: ${e.tooling}`)
  }
  return { count: entries.length, missing }
}

function collectDirEntries(root, relDir) {
  const dir = join(root, relDir)
  if (!existsSync(dir)) return 0
  return listFiles(dir, (f) => f.endsWith(".yaml") || f.endsWith(".md")).length
}

function collectModels(root) {
  const counts = {}
  const skip = new Set(["node_modules", ".git", ".next"])
  const files = listFiles(root, (f) => {
    const rel = relative(root, f)
    if ([...skip].some((s) => rel.startsWith(s))) return false
    return Object.values(MODEL_EXT).flat().some((ext) => f.endsWith(ext))
  })
  for (const [type, exts] of Object.entries(MODEL_EXT)) {
    counts[type] = files.filter((f) => exts.some((ext) => f.endsWith(ext))).length
  }
  return counts
}

function collectDomainPacks(root) {
  const dir = join(root, ".memory/domain-knowledge")
  if (!existsSync(dir)) return 0
  return listFiles(dir, (f) => f.endsWith(".yaml") && !f.endsWith("index.yaml")).length
}

function printText(result) {
  console.log("awp discover — repository inventory")
  console.log("===================================")
  for (const [key, value] of Object.entries(result)) {
    if (key === "missing") continue
    if (typeof value === "object" && value !== null) {
      console.log(`${key}:`)
      for (const [k, v] of Object.entries(value)) console.log(`  ${k}: ${v}`)
    } else {
      console.log(`${key}: ${value}`)
    }
  }
  const missing = result.missing || []
  if (missing.length === 0) {
    console.log("missing: none — all registry entries resolve")
  } else {
    console.log(`missing (${missing.length}):`)
    for (const m of missing) console.log(`  - ${m}`)
  }
}
