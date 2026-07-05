/**
 * kb.js — deterministic validator for the domain-knowledge base.
 *
 * Enforces the contract in .schemas/domain-knowledge/schema.yaml across every
 * .memory/domain-knowledge/**\/<domain>.yaml file plus the graph-level
 * invariants (KB-I1..I5) over the aggregated index.
 *
 * This is what makes the "26 → ~100 domains" growth safe: a dangling `implies`,
 * an orphan trigger-map domain, a duplicate id, or a stale review date is a
 * mechanical error, not something a human has to eyeball.
 *
 * All checks are code, not model judgment. Returns
 *   { errors: Issue[], warnings: Issue[], stats: {...} }
 * where Issue = { code, file, path, hint }.
 */
import { existsSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { listFiles, tryReadYaml } from "./lib/repo.js"

const KB_DIR = ".memory/domain-knowledge"
const INDEX = ".memory/domain-knowledge/index.yaml"

const RE = {
  domainId: /^[a-z][a-z0-9-]*$/,
  constraintId: /^[A-Z]{2,5}-C[0-9]+$/,
  seedId: /^discovery\/[a-z0-9-]+\/REQ-[0-9]+$/,
  version: /^[0-9]+\.[0-9]+\.[0-9]+$/,
  isoDate: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  period: /^P([0-9]+)([YMD])$/,
}

// Special trigger token: a baseline cross-cutting domain needs no keyword.
const BASELINE_TOKEN = "ANY-USER-FACING"

/**
 * @param {string} root repo root
 * @param {object} [opts]
 * @param {string} [opts.today] ISO date used for staleness math (injectable for tests)
 */
export function validateKb(root, opts = {}) {
  const errors = []
  const warnings = []
  const today = opts.today || new Date().toISOString().slice(0, 10)

  const kbDir = join(root, KB_DIR)
  if (!existsSync(kbDir)) {
    errors.push({ code: "KB-000", file: KB_DIR, path: "", hint: "domain-knowledge directory not found" })
    return { errors, warnings, stats: { domains: 0, packs: 0 } }
  }

  // Load every domain file (any depth), skipping index/template/registry files.
  const files = listFiles(kbDir, (f) => f.endsWith(".yaml"))
  const domains = new Map() // id -> { doc, file }
  const idToFile = new Map()

  for (const abs of files) {
    const rel = relative(root, abs).replace(/\\/g, "/")
    const base = abs.replace(/\\/g, "/").split("/").pop()
    if (["index.yaml", "index.head.yaml", "TEMPLATE.yaml", "registry.yaml"].includes(base)) continue

    const doc = tryReadYaml(abs)
    if (doc === null) {
      errors.push({ code: "KB-PARSE", file: rel, path: "", hint: "file is not valid YAML" })
      continue
    }
    validateDomainFile(doc, rel, { errors, warnings, today })

    if (doc.id) {
      if (idToFile.has(doc.id)) {
        // KB-I4: duplicate id across the KB.
        errors.push({ code: "KB-I4", file: rel, path: "id", hint: `duplicate domain id "${doc.id}" (also in ${idToFile.get(doc.id)})` })
      } else {
        idToFile.set(doc.id, rel)
        domains.set(doc.id, { doc, file: rel })
      }
    }
  }

  // KB-I1: every `implies` target exists.
  for (const [id, { doc, file }] of domains) {
    for (const target of doc.implies || []) {
      if (!domains.has(target)) {
        errors.push({ code: "KB-I1", file, path: `implies`, hint: `"${id}" implies "${target}" which has no domain file` })
      }
    }
  }

  // Load the aggregated index for trigger-map / registry invariants.
  const index = tryReadYaml(join(root, INDEX)) || {}
  const declaredPacks = new Set(Object.keys(index.packs || {}))

  // KB-I2: every trigger-map domain resolves. Tolerate both the authored shape
  // ({keywords:[...], domains}) and the generated shape ({keyword, domains}).
  const kwsOf = (entry) => entry.keywords || (entry.keyword ? [entry.keyword] : [])
  for (const entry of index["trigger-map"] || []) {
    for (const d of entry.domains || []) {
      if (!domains.has(d)) {
        errors.push({ code: "KB-I2", file: INDEX, path: `trigger-map`, hint: `trigger keyword(s) [${kwsOf(entry).join(", ")}] map to "${d}" which has no domain file` })
      }
    }
  }

  // KB-I3: keyword collision across > 2 packs without disambiguation.
  const disambig = new Set((index.disambiguation || []).map((d) => d.keyword))
  const keywordPacks = new Map() // keyword -> Set(pack)
  for (const entry of index["trigger-map"] || []) {
    for (const kw of kwsOf(entry)) {
      const packs = keywordPacks.get(kw) || new Set()
      for (const d of entry.domains || []) {
        const dom = domains.get(d)
        if (dom?.doc.pack) packs.add(dom.doc.pack)
      }
      keywordPacks.set(kw, packs)
    }
  }
  for (const [kw, packs] of keywordPacks) {
    if (packs.size > 2 && !disambig.has(kw)) {
      warnings.push({ code: "KB-I3", file: INDEX, path: `trigger-map`, hint: `keyword "${kw}" maps into ${packs.size} packs (${[...packs].join(", ")}) — add a disambiguation entry` })
    }
  }

  // KB-I5: registry <-> files agree (only if a registry is present in index).
  const registered = new Set()
  for (const group of Object.values(index.domains || {})) {
    for (const d of group || []) if (d.id) registered.add(d.id)
  }
  if (registered.size > 0) {
    for (const id of registered) {
      if (!domains.has(id)) errors.push({ code: "KB-I5", file: INDEX, path: `domains`, hint: `registry lists "${id}" but no domain file exists` })
    }
    for (const id of domains.keys()) {
      if (!registered.has(id)) warnings.push({ code: "KB-I5", file: idToFile.get(id), path: `id`, hint: `domain "${id}" is not listed in index.yaml domains registry` })
    }
  }

  // W5: staleness — review.last-reviewed + cadence < today  => warn.
  for (const [id, { doc, file }] of domains) {
    const r = doc.review
    if (!r) continue
    const due = addPeriod(r["last-reviewed"], r.cadence)
    if (due && due < today) {
      warnings.push({ code: "KB-STALE", file, path: "review", hint: `"${id}" review overdue (due ${due}, cadence ${r.cadence}, last ${r["last-reviewed"]})` })
    }
  }

  return {
    errors,
    warnings,
    stats: {
      domains: domains.size,
      packs: declaredPacks.size,
      functional: [...domains.values()].filter((d) => d.doc.type === "functional").length,
      crossCutting: [...domains.values()].filter((d) => d.doc.type === "cross-cutting").length,
    },
  }
}

// ---------------------------------------------------------------------------
// Single-file field validation
// ---------------------------------------------------------------------------

function validateDomainFile(doc, file, ctx) {
  const { errors, warnings } = ctx
  const err = (path, hint) => errors.push({ code: "KB-FIELD", file, path, hint })

  // id
  if (!doc.id) err("id", "required field missing")
  else if (!RE.domainId.test(doc.id)) err("id", `"${doc.id}" is not kebab-case`)

  // type
  if (!doc.type) err("type", "required field missing")
  else if (!["functional", "cross-cutting"].includes(doc.type)) err("type", `"${doc.type}" not in [functional, cross-cutting]`)

  // version
  if (!doc.version) err("version", "required field missing")
  else if (!RE.version.test(String(doc.version))) err("version", `"${doc.version}" is not semver`)

  // triggers
  if (!Array.isArray(doc.triggers) || doc.triggers.length === 0) {
    err("triggers", "required: at least one trigger")
  } else {
    doc.triggers.forEach((t, i) => {
      if (typeof t === "string") return
      if (t && typeof t === "object") {
        if (!t.term) err(`triggers[${i}]`, "trigger map missing `term`")
        if (t.synonyms && !Array.isArray(t.synonyms)) err(`triggers[${i}].synonyms`, "must be a list")
      } else err(`triggers[${i}]`, "must be a string or {term, synonyms}")
    })
  }

  // constraints
  if (!Array.isArray(doc.constraints) || doc.constraints.length === 0) {
    err("constraints", "required: at least one constraint")
  } else {
    if (doc.constraints.length > 6) warnings.push({ code: "KB-FIELD", file, path: "constraints", hint: `${doc.constraints.length} constraints — keep domains focused (<=6)` })
    doc.constraints.forEach((c, i) => {
      if (!c || typeof c !== "object") { err(`constraints[${i}]`, "must be {id, rule}"); return }
      if (!c.id || !RE.constraintId.test(c.id)) err(`constraints[${i}].id`, `"${c?.id}" must match <DOM>-C<n>`)
      if (!c.rule || String(c.rule).trim().length < 8) err(`constraints[${i}].rule`, "rule missing or too short")
    })
  }

  // blueprint-sections
  if (!Array.isArray(doc["blueprint-sections"]) || doc["blueprint-sections"].length === 0) {
    err("blueprint-sections", "required: at least one target section")
  }

  // requirement-seeds (optional)
  for (const [i, s] of (doc["requirement-seeds"] || []).entries()) {
    if (!s || typeof s !== "object") { err(`requirement-seeds[${i}]`, "must be {id, title, ac}"); continue }
    if (!s.id || !RE.seedId.test(s.id)) err(`requirement-seeds[${i}].id`, `"${s?.id}" must match discovery/<domain>/REQ-<n>`)
    if (!s.title) err(`requirement-seeds[${i}].title`, "missing title")
    if (!s.ac) err(`requirement-seeds[${i}].ac`, "missing acceptance criterion")
  }

  // standards provenance (optional but warn on bare strings)
  for (const [i, s] of (doc.standards || []).entries()) {
    if (typeof s === "string") {
      warnings.push({ code: "KB-PROV", file, path: `standards[${i}]`, hint: `standard "${s}" has no provenance — prefer {id, version, verified, url}` })
    } else if (s && typeof s === "object") {
      if (!s.id) err(`standards[${i}].id`, "standard map missing `id`")
      if (s.verified && !RE.isoDate.test(s.verified)) err(`standards[${i}].verified`, `"${s.verified}" is not YYYY-MM-DD`)
    }
  }

  // review provenance (optional)
  if (doc.review) {
    const r = doc.review
    if (!r.cadence || !RE.period.test(r.cadence)) err("review.cadence", `"${r.cadence}" must be an ISO period like P12M`)
    if (!r["last-reviewed"] || !RE.isoDate.test(r["last-reviewed"])) err("review.last-reviewed", `"${r["last-reviewed"]}" must be YYYY-MM-DD`)
    if (!r.owner) err("review.owner", "missing owner")
  }
}

// ---------------------------------------------------------------------------
// Date math (no external deps; UTC, calendar-correct for Y/M/D periods)
// ---------------------------------------------------------------------------

/** Add an ISO period (P12M / P1Y / P30D) to an ISO date; returns ISO date or null. */
export function addPeriod(isoDate, period) {
  if (!isoDate || !RE.isoDate.test(isoDate)) return null
  const m = RE.period.exec(period || "")
  if (!m) return null
  const n = Number(m[1])
  const unit = m[2]
  const [y, mo, d] = isoDate.split("-").map(Number)
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (unit === "Y") dt.setUTCFullYear(dt.getUTCFullYear() + n)
  else if (unit === "M") dt.setUTCMonth(dt.getUTCMonth() + n)
  else if (unit === "D") dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}
