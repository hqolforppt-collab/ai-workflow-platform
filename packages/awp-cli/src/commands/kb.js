/**
 * kb.js (command) — knowledge-base operations.
 *
 *   awp kb validate            run the deterministic KB validator (kb.js engine)
 *   awp kb build-index         regenerate index.yaml from index.head.yaml + files
 *   awp kb build-index --check verify index.yaml is up to date (CI drift gate)
 *   awp kb stats               print domain/pack counts
 *
 * `awp validate --kb` routes to the same validator.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join, relative } from "node:path"
import YAML from "yaml"
import { requireRepoRoot, listFiles, tryReadYaml } from "../lib/repo.js"
import { validateKb } from "../kb.js"

const KB_DIR = ".memory/domain-knowledge"
const INDEX = join(KB_DIR, "index.yaml")
const HEAD = join(KB_DIR, "index.head.yaml")

export async function kb(sub, flags) {
  const root = requireRepoRoot()
  switch (sub) {
    case "validate":
      return kbValidate(root, flags)
    case "build-index":
      return kbBuildIndex(root, flags)
    case "stats":
      return kbStats(root)
    default:
      console.error(`awp kb: unknown subcommand "${sub}". Usage: awp kb validate|build-index|stats`)
      return 1
  }
}

// ---------------------------------------------------------------------------

export function kbValidate(root, flags = {}) {
  const { errors, warnings, stats } = validateKb(root)

  for (const w of warnings) {
    console.log(`WARN  ${w.code.padEnd(8)} ${String(w.file).padEnd(48)} ${w.path} → ${w.hint}`)
  }
  for (const e of errors) {
    console.log(`FAIL  ${e.code.padEnd(8)} ${String(e.file).padEnd(48)} ${e.path} → ${e.hint}`)
  }

  const summary = `${stats.domains} domains (${stats.functional} functional, ${stats.crossCutting} cross-cutting), ${stats.packs} packs`
  if (errors.length === 0) {
    console.log(`\n✓ KB valid: ${summary}${warnings.length ? ` — ${warnings.length} warning(s)` : ""}`)
    return warnings.length && flags["warn-as-error"] ? 2 : 0
  }
  console.log(`\n✗ KB invalid: ${errors.length} error(s), ${warnings.length} warning(s) — ${summary}`)
  return 1
}

// ---------------------------------------------------------------------------
// Index generation: index.head.yaml (authored) + domain files -> index.yaml.
// The generated body (trigger-map, implication-map, domains registry, packs
// counts) is derived deterministically so adding a domain file needs no manual
// index edit; CI runs --check to catch drift, mirroring `awp build --aggregate`.
// ---------------------------------------------------------------------------

function buildIndexDoc(root) {
  const head = tryReadYaml(join(root, HEAD))
  if (!head) throw new Error(`missing ${HEAD} — the authored index header`)

  const kbDir = join(root, KB_DIR)
  const files = listFiles(kbDir, (f) => f.endsWith(".yaml"))
  const domains = []
  for (const abs of files) {
    const base = abs.replace(/\\/g, "/").split("/").pop()
    if (["index.yaml", "index.head.yaml", "TEMPLATE.yaml", "registry.yaml"].includes(base)) continue
    const doc = tryReadYaml(abs)
    if (doc && doc.id) domains.push({ doc, file: relative(join(root, KB_DIR), abs).replace(/\\/g, "/") })
  }
  domains.sort((a, b) => a.doc.id.localeCompare(b.doc.id))

  // Registry, split by type.
  const functional = domains.filter((d) => d.doc.type === "functional").map((d) => ({ id: d.doc.id, file: d.file }))
  const crossCutting = domains.filter((d) => d.doc.type === "cross-cutting").map((d) => ({ id: d.doc.id, file: d.file }))

  // Implication map from each domain's `implies`, plus the authored baseline.
  const implicationMap = {}
  for (const { doc } of domains) {
    if (Array.isArray(doc.implies) && doc.implies.length) implicationMap[doc.id] = [...doc.implies]
  }
  if (head["baseline-any-user-facing"]) implicationMap["ANY-USER-FACING"] = head["baseline-any-user-facing"]

  // Trigger map: keyword -> domains, derived from each domain's triggers
  // (term + synonyms flattened). ANY-USER-FACING triggers are baseline, skipped.
  const kwToDomains = new Map()
  for (const { doc } of domains) {
    for (const t of doc.triggers || []) {
      const terms = typeof t === "string" ? [t] : [t.term, ...(t.synonyms || [])]
      for (const term of terms) {
        if (!term || term === "ANY-USER-FACING") continue
        const set = kwToDomains.get(term) || new Set()
        set.add(doc.id)
        kwToDomains.set(term, set)
      }
    }
  }
  const triggerMap = [...kwToDomains.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([keyword, set]) => ({ keyword, domains: [...set].sort() }))

  // Pack rollup.
  const packCounts = {}
  for (const { doc } of domains) {
    const p = doc.pack || (doc.type === "cross-cutting" ? "core" : "core")
    packCounts[p] = (packCounts[p] || 0) + 1
  }

  return {
    _generated: "by `awp kb build-index` from index.head.yaml + domain files — do not edit by hand",
    version: head.version,
    status: head.status,
    authority: head.authority,
    packs: packCounts,
    "trigger-map": triggerMap,
    "implication-map": implicationMap,
    domains: { functional, "cross-cutting": crossCutting },
    disambiguation: head.disambiguation || [],
    guarantees: head.guarantees || [],
  }
}

function kbBuildIndex(root, flags) {
  let doc
  try {
    doc = buildIndexDoc(root)
  } catch (err) {
    console.error(`awp kb build-index: ${err.message}`)
    return 1
  }
  const out = YAML.stringify(doc, { lineWidth: 0 })
  const indexPath = join(root, INDEX)

  if (flags.check) {
    const current = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : ""
    if (current.trim() === out.trim()) {
      console.log("✓ index.yaml is up to date")
      return 0
    }
    console.error("✗ index.yaml is stale — run `awp kb build-index` and commit the result")
    return 1
  }

  writeFileSync(indexPath, out)
  console.log(`✓ wrote ${INDEX} (${doc.domains.functional.length} functional + ${doc.domains["cross-cutting"].length} cross-cutting domains)`)
  return 0
}

function kbStats(root) {
  const { stats } = validateKb(root)
  console.log(`Domains:       ${stats.domains}`)
  console.log(`  functional:  ${stats.functional}`)
  console.log(`  cross-cut:   ${stats.crossCutting}`)
  console.log(`Packs:         ${stats.packs}`)
  return 0
}
