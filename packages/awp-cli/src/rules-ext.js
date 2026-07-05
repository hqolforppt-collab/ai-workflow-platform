/**
 * rules-ext.js — v3.0 extended blueprint rules.
 *
 * Two families, both deterministic (no model judgment):
 *   VAL-050..054  schema conformance — the blueprint matches the declared
 *                 contract in .schemas/workflow-blueprint/schema.yaml.
 *   VAL-060..063  substance lints — catch the mechanical *symptoms* of
 *                 low-effort content (placeholders, fake acceptance criteria,
 *                 implausible numbers, copy-paste duplication).
 *
 * Called by validateBlueprint(); contributes to {passed, failed, warnings}.
 * Kept separate from validate.js so the original 17 rules stay readable.
 *
 * Signature: extendedRules(allContent, filesMap, {level, schemaSections})
 *   -> { passed: string[], failed: Issue[], warnings: Issue[] }
 */

// TBD/TODO/etc. are high-signal. The angle-bracket clause only fires on a
// STANDALONE fill token (preceded by whitespace or start-of-string) so it
// flags "Feature <name>" but not a documented format like
// "discovery/<domain>/<rule-id>" where the `<` follows a slash.
const PLACEHOLDER = /\b(TBD|TODO|FIXME|XXX|LOREM)\b|(^|\s)<[a-z][a-z0-9 _-]*>/i

// Numeric plausibility windows: [min, max] in canonical units. Values outside
// the window are almost always copy-paste errors, not real specs.
const PLAUSIBILITY = [
  { key: "session-timeout", unitSeconds: true, min: 300, max: 86400, label: "session timeout 5m–24h" },
  { key: "retention", unitDays: true, min: 1, max: 3650, label: "retention 1d–10y" },
]

export function extendedRules(allContent, filesMap, opts = {}) {
  const { level = "L6", schemaSections = null } = opts
  const passed = []
  const failed = []
  const warnings = []
  const atL4plus = ["L4", "L5", "L6"].includes(level)

  const fileFor = (section) => {
    for (const [file, doc] of Object.entries(filesMap)) if (doc[section] !== undefined) return file
    return "aggregate"
  }

  // ---- VAL-050: identity + maturity conformance --------------------------
  const project = allContent.project || {}
  let v050 = 0
  if (!project.id || !/^BLU-[A-Z0-9-]+$/.test(project.id)) {
    failed.push({ rule: "VAL-050", file: fileFor("project"), path: "project.id", hint: `project.id "${project.id}" must match BLU-<ID>` })
    v050++
  }
  const ml = project["maturity-level"]
  if (ml && !/^L[1-6]$/.test(ml)) {
    failed.push({ rule: "VAL-050", file: fileFor("project"), path: "project.maturity-level", hint: `"${ml}" not in L1..L6` })
    v050++
  }
  if (v050 === 0) passed.push("VAL-050")

  // ---- VAL-051: no undeclared top-level sections -------------------------
  // Top-level keys must be a known section, `_meta`, or an `x-` extension.
  let v051 = 0
  if (schemaSections && schemaSections.length) {
    const known = new Set([...schemaSections, "_meta"])
    for (const key of Object.keys(allContent)) {
      if (key === "_meta" || key.startsWith("x-")) continue
      if (!known.has(key)) {
        failed.push({ rule: "VAL-051", file: fileFor(key), path: key, hint: `undeclared top-level section "${key}" (extensions must be prefixed x-)` })
        v051++
      }
    }
  }
  if (v051 === 0) passed.push("VAL-051")

  // ---- VAL-052: item identity fields -------------------------------------
  // Every requirement/workflow/api/form item carries id + a human label.
  let v052 = 0
  const reqs = [...getItems((allContent.requirements || {}).explicit), ...getItems((allContent.requirements || {}).hidden)]
  for (const r of reqs) {
    if (!r.id || !r.title) { failed.push({ rule: "VAL-052", file: fileFor("requirements"), path: `requirements.${r.id || "?"}`, hint: "requirement missing id or title" }); v052++ }
  }
  for (const wf of flattenWorkflows(allContent.workflows)) {
    if (!wf.id || !(wf.name || wf.title)) { failed.push({ rule: "VAL-052", file: fileFor("workflows"), path: `workflows.${wf.id || "?"}`, hint: "workflow missing id or name" }); v052++ }
  }
  if (v052 === 0) passed.push("VAL-052")

  // ---- VAL-053: extended id formats --------------------------------------
  // Decisions (DMN) and _meta.blueprint_id, beyond VAL-020's coverage.
  let v053 = 0
  for (const [file, doc] of Object.entries(filesMap)) {
    const bid = doc._meta && doc._meta.blueprint_id
    if (bid && !/^BLU-[A-Z0-9-]+$/.test(bid)) {
      failed.push({ rule: "VAL-053", file, path: "_meta.blueprint_id", hint: `"${bid}" must match BLU-<ID>` })
      v053++
    }
  }
  for (const d of getItems(allContent["decision-tables"] || allContent.decisions)) {
    if (d.id && !/^DEC-\d+$/.test(d.id)) {
      failed.push({ rule: "VAL-053", file: fileFor("decision-tables"), path: `decisions.${d.id}`, hint: `"${d.id}" must match DEC-<n>` })
      v053++
    }
  }
  if (v053 === 0) passed.push("VAL-053")

  // ---- VAL-054: _meta.depends_on resolves + acyclic ----------------------
  let v054 = 0
  const stageOf = {}
  for (const [file, doc] of Object.entries(filesMap)) {
    if (doc._meta && doc._meta.stage) stageOf[doc._meta.stage] = { file, deps: doc._meta.depends_on || [] }
  }
  for (const [stage, { file, deps }] of Object.entries(stageOf)) {
    for (const dep of deps) {
      if (!stageOf[dep]) {
        failed.push({ rule: "VAL-054", file, path: "_meta.depends_on", hint: `stage "${stage}" depends on "${dep}" which is not present` })
        v054++
      }
    }
  }
  if (v054 === 0 && hasCycle(stageOf)) {
    failed.push({ rule: "VAL-054", file: "aggregate", path: "_meta.depends_on", hint: "cyclic stage dependency detected" })
    v054++
  }
  if (v054 === 0) passed.push("VAL-054")

  // ---- VAL-060: no placeholder smells (hard) -----------------------------
  let v060 = 0
  walkStrings(allContent, (str, path) => {
    if (PLACEHOLDER.test(str)) {
      failed.push({ rule: "VAL-060", file: "aggregate", path, hint: `placeholder text: "${truncate(str)}"` })
      v060++
    }
  })
  if (v060 === 0) passed.push("VAL-060")

  // ---- VAL-061: real Given/When/Then (hard) ------------------------------
  let v061 = 0
  for (const r of reqs) {
    for (const ac of toList(r["acceptance-criteria"])) {
      const s = String(ac)
      const hasAll = /\bgiven\b/i.test(s) && /\bwhen\b/i.test(s) && /\bthen\b/i.test(s)
      if (!hasAll) {
        failed.push({ rule: "VAL-061", file: fileFor("requirements"), path: `requirements.${r.id}.acceptance-criteria`, hint: `not a Given/When/Then criterion: "${truncate(s)}"` })
        v061++
      }
    }
  }
  if (v061 === 0) passed.push("VAL-061")

  // ---- VAL-062: numeric plausibility (warn at L1-3, hard at L4+) ----------
  let v062 = 0
  walkNumbersWithKey(allContent, (num, key, path) => {
    for (const w of PLAUSIBILITY) {
      if (!key.toLowerCase().includes(w.key)) continue
      const inWindow = num >= w.min && num <= w.max
      if (!inWindow) {
        const issue = { rule: "VAL-062", file: "aggregate", path, hint: `${key}=${num} outside plausible window (${w.label})` }
        if (atL4plus) { failed.push(issue); v062++ } else { warnings.push(issue) }
      }
    }
  })
  if (v062 === 0) passed.push("VAL-062")

  // ---- VAL-063: near-duplicate requirements (hard) -----------------------
  let v063 = 0
  const texts = reqs.map((r) => ({ id: r.id, text: `${r.title || ""} ${r.description || ""}`.trim() }))
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      if (!texts[i].text || !texts[j].text) continue
      if (shingleSim(texts[i].text, texts[j].text) > 0.85) {
        failed.push({ rule: "VAL-063", file: fileFor("requirements"), path: `requirements.${texts[i].id}~${texts[j].id}`, hint: `near-duplicate requirement text (>85% similar)` })
        v063++
      }
    }
  }
  if (v063 === 0) passed.push("VAL-063")

  return { passed, failed, warnings }
}

// ---------------------------------------------------------------------------
// Helpers (self-contained so validate.js internals stay private)
// ---------------------------------------------------------------------------

function getItems(section) {
  if (!section) return []
  if (Array.isArray(section)) return section
  if (section.items) return section.items
  return []
}

function flattenWorkflows(section) {
  if (!section) return []
  if (Array.isArray(section)) return section
  const out = []
  if (section.root) out.push(section.root)
  for (const k of ["dependent", "sub", "items"]) if (Array.isArray(section[k])) out.push(...section[k])
  return out
}

function toList(v) {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function truncate(s, n = 60) {
  s = String(s).replace(/\s+/g, " ")
  return s.length > n ? s.slice(0, n) + "…" : s
}

/** Depth-first walk yielding every string leaf with a dotted path. */
function walkStrings(node, fn, path = "") {
  if (node == null) return
  if (typeof node === "string") { fn(node, path); return }
  if (Array.isArray(node)) { node.forEach((v, i) => walkStrings(v, fn, `${path}[${i}]`)); return }
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "_meta") continue
      walkStrings(v, fn, path ? `${path}.${k}` : k)
    }
  }
}

/** Walk numbers, passing the nearest object key so plausibility can target fields. */
function walkNumbersWithKey(node, fn, key = "", path = "") {
  if (node == null) return
  if (typeof node === "number") { fn(node, key, path); return }
  if (typeof node === "string") {
    const m = /^(\d+)\s*(s|sec|second|m|min|minute|h|hour|d|day)/i.exec(node.trim())
    if (m) fn(toSeconds(Number(m[1]), m[2], key), key, path)
    return
  }
  if (Array.isArray(node)) { node.forEach((v, i) => walkNumbersWithKey(v, fn, key, `${path}[${i}]`)); return }
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "_meta") continue
      walkNumbersWithKey(v, fn, k, path ? `${path}.${k}` : k)
    }
  }
}

function toSeconds(n, unit, key) {
  // Retention windows are expressed in days; time windows in seconds.
  const u = unit.toLowerCase()[0]
  if (key.toLowerCase().includes("retention")) {
    if (u === "d") return n
    if (u === "h") return n / 24
    if (u === "m") return n / 1440
    return n
  }
  if (u === "s") return n
  if (u === "m") return n * 60
  if (u === "h") return n * 3600
  if (u === "d") return n * 86400
  return n
}

/** Jaccard similarity over 3-word shingles. */
function shingleSim(a, b) {
  const sh = (t) => {
    const w = String(t).toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean)
    const s = new Set()
    for (let i = 0; i + 2 < w.length + 1; i++) s.add(w.slice(i, i + 3).join(" "))
    return s
  }
  const A = sh(a), B = sh(b)
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  return inter / (A.size + B.size - inter)
}

function hasCycle(stageOf) {
  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = {}
  for (const k of Object.keys(stageOf)) color[k] = WHITE
  const dfs = (node) => {
    color[node] = GRAY
    for (const dep of (stageOf[node]?.deps || [])) {
      if (!stageOf[dep]) continue
      if (color[dep] === GRAY) return true
      if (color[dep] === WHITE && dfs(dep)) return true
    }
    color[node] = BLACK
    return false
  }
  for (const k of Object.keys(stageOf)) if (color[k] === WHITE && dfs(k)) return true
  return false
}
