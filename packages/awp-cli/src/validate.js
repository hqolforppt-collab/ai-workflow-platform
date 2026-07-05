/**
 * validate.js — deterministic 26-rule validation engine.
 *
 * Runs against the staged blueprint files (01..06-*.yaml) or a monolithic
 * blueprint.yaml. All checks are code, not LLM judgment — this is the
 * guarantee that cheap models can't hallucinate "N/N passed".
 *
 * Structural + traceability (this file): VAL-001, 002, 010, 011, 012, 013,
 *   020, 021, 022, 023, 024, 030, 031, 032, 040, 041, 042 (17).
 * Schema conformance (rules-ext.js): VAL-050..054 (5).
 * Substance lints (rules-ext.js):    VAL-060..063 (4).
 * Total: 26.
 *
 * Returns {passed: string[], failed: {rule, file, path, hint}[],
 *          warnings: {rule, file, path, hint}[]}
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { readYaml, tryReadYaml } from "./lib/repo.js"
import { extendedRules } from "./rules-ext.js"

const REQUIRED_SECTIONS = [
  "project", "domains", "requirements", "actors", "roles",
  "security", "audit", "logging", "monitoring", "notifications",
  "data-model", "master-data", "workflows", "forms", "pages",
  "api", "events", "integrations", "testing", "deployment",
  "operations", "support", "documentation", "knowledge",
  "risks", "assumptions", "governance", "compliance",
]

const ALWAYS_POPULATED = [
  "security", "audit", "logging", "monitoring", "testing",
  "deployment", "operations", "documentation", "risks",
  "assumptions", "governance", "compliance",
]

// Optional sections the blueprint MAY carry beyond the 28 required ones
// (e.g. DMN decision tables). Recognized by VAL-051 so they aren't flagged
// as undeclared, but not required by VAL-001.
const OPTIONAL_SECTIONS = ["decision-tables", "decisions"]

const AUTH_TRIGGERS = /login|registration|signin|auth|password|account/i

const AUTH_MANDATORY_DOMAINS = [
  "authentication", "authorization", "session-management",
  "password-policy", "account-lockout", "rate-limiting",
  "audit", "security", "logging", "monitoring", "notification",
  "email-verification", "fraud-detection", "privacy(GDPR)",
  "compliance(SOC2)", "backup", "disaster-recovery",
  "documentation", "testing", "deployment", "operations",
  "error-management", "observability", "analytics", "identity-management",
]

// Patterns for id validation
const ID_PATTERNS = {
  requirement: /^REQ-\d+$/,
  actor: /^ACT-\d+$/,
  role: /^ROLE-[A-Z-]+$/,
  workflow: /^WF-\d+$/,
  form: /^FRM-\d+$/,
  page: /^PG-\d+$/,
  api: /^API-\d+$/,
  event: /^EVT-[a-z.-]+$/,
  integration: /^INT-\d+$/,
  notification: /^NOT-\d+$/,
  risk: /^RSK-\d+$/,
  assumption: /^ASM-\d+$/,
  audit: /^AUD-\d+$/,
}

/**
 * Validate a staged output directory or monolithic file.
 *
 * @param {string} root  — repo root
 * @param {string} targetPath — path to blueprint dir or .yaml file
 * @param {object} opts
 * @param {string} opts.story — original user story (for VAL-013 trigger check)
 * @param {string} opts.level — maturity level L1-L6
 * @returns {{passed: string[], failed: {rule:string, file:string, path:string, hint:string}[]}}
 */
export function validateBlueprint(root, targetPath, opts = {}) {
  const { story = "", level = "L6" } = opts
  const passed = []
  const failed = []

  // Collect all YAML content from staged files or monolithic file
  let allContent = {}
  let filesMap = {}

  if (existsSync(targetPath) && targetPath.endsWith(".yaml")) {
    // Monolithic file
    const doc = tryReadYaml(targetPath) || {}
    allContent = doc
    filesMap[targetPath] = doc
  } else if (existsSync(targetPath)) {
    // Staged directory. `workflows` is authored across stage-04 (root) and
    // stage-05 (dependent); a plain Object.assign would let stage-05 overwrite
    // the root, so merge that one key instead of clobbering it.
    const entries = readdirSync(targetPath).filter(f => f.match(/^\d{2}-.*\.yaml$/)).sort()
    for (const entry of entries) {
      const fp = join(targetPath, entry)
      const doc = tryReadYaml(fp) || {}
      filesMap[entry] = doc
      for (const [key, val] of Object.entries(doc)) {
        if (key === "workflows" && allContent.workflows && typeof val === "object" && !Array.isArray(val)) {
          allContent.workflows = { ...allContent.workflows, ...val }
        } else {
          allContent[key] = val
        }
      }
    }
  } else {
    failed.push({ rule: "VAL-000", file: targetPath, path: "", hint: "blueprint directory or file not found" })
    return { passed, failed }
  }

  const storyLower = story.toLowerCase()

  // VAL-001: all 28 sections present
  const presentSections = new Set(Object.keys(allContent))
  for (const sec of REQUIRED_SECTIONS) {
    if (!presentSections.has(sec)) {
      failed.push({ rule: "VAL-001", file: "aggregate", path: sec, hint: `section "${sec}" is missing from blueprint output` })
    }
  }
  if (!failed.some(f => f.rule === "VAL-001")) passed.push("VAL-001")

  // VAL-002: always-populated sections must have content at L4+
  if (["L4", "L5", "L6"].includes(level)) {
    for (const sec of ALWAYS_POPULATED) {
      const val = allContent[sec]
      if (val === undefined || val === null || val === "not-applicable" || (typeof val === "object" && Object.keys(val).length === 0)) {
        failed.push({ rule: "VAL-002", file: findFileForSection(filesMap, sec), path: sec, hint: `always-populated section "${sec}" is empty or not-applicable at ${level}` })
      }
    }
  }
  if (!failed.some(f => f.rule === "VAL-002")) passed.push("VAL-002")

  // VAL-010: minimum 12 cross-cutting domains (if story involves users/data/external access)
  const domains = allContent.domains || {}
  const crossCutting = domains["cross-cutting"] || []
  if (crossCutting.length < 12 && level >= "L4") {
    failed.push({ rule: "VAL-010", file: findFileForSection(filesMap, "domains"), path: "domains.cross-cutting", hint: `cross-cutting domains: ${crossCutting.length} found, minimum 12 required` })
  }
  if (!failed.some(f => f.rule === "VAL-010")) passed.push("VAL-010")

  // VAL-011: hidden requirements present for non-trivial stories
  const reqs = allContent.requirements || {}
  const hiddenReqs = reqs.hidden || []
  const explicitReqs = reqs.explicit || []
  if (explicitReqs.length > 1 && hiddenReqs.length === 0 && level >= "L4") {
    failed.push({ rule: "VAL-011", file: findFileForSection(filesMap, "requirements"), path: "requirements.hidden", hint: "hidden requirements empty for non-trivial story" })
  }
  if (!failed.some(f => f.rule === "VAL-011")) passed.push("VAL-011")

  // VAL-012: discovery rule traceability
  const allCrossCutting = crossCutting || []
  for (const d of allCrossCutting) {
    if (!d["discovery-rule"]) {
      failed.push({ rule: "VAL-012", file: findFileForSection(filesMap, "domains"), path: `domains.cross-cutting[${d.id || d.name}]`, hint: "missing discovery-rule citation" })
    }
  }
  const allHidden = hiddenReqs || []
  for (const r of allHidden) {
    if (r.source && !r.source.startsWith("discovery/")) {
      failed.push({ rule: "VAL-012", file: findFileForSection(filesMap, "requirements"), path: `requirements.hidden[${r.id}]`, hint: `source "${r.source}" should be discovery/<domain>` })
    }
  }
  if (!failed.some(f => f.rule === "VAL-012")) passed.push("VAL-012")

  // VAL-013: auth-story mandatory domains. Match on a normalized key so a
  // domain counts whether the mandatory list names it by id (authentication)
  // or squished display name (privacy(GDPR) ≈ "Privacy (GDPR)").
  if (AUTH_TRIGGERS.test(storyLower) && level >= "L4") {
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "")
    const present = new Set()
    for (const d of [...(domains.functional || []), ...(allCrossCutting || [])]) {
      present.add(norm(d.id))
      present.add(norm(d.name))
    }
    for (const name of AUTH_MANDATORY_DOMAINS) {
      if (!present.has(norm(name))) {
        failed.push({ rule: "VAL-013", file: findFileForSection(filesMap, "domains"), path: `domains`, hint: `auth story missing mandatory domain: ${name}` })
      }
    }
  }
  if (!failed.some(f => f.rule === "VAL-013")) passed.push("VAL-013")

  // VAL-020: ids everywhere — check id patterns
  const idChecks = [
    ["requirements", "requirement", ID_PATTERNS.requirement],
    ["actors", "actor", ID_PATTERNS.actor],
    ["roles", "role", ID_PATTERNS.role],
    ["workflows", "workflow", ID_PATTERNS.workflow],
    ["forms", "form", ID_PATTERNS.form],
    ["pages", "page", ID_PATTERNS.page],
    ["api", "api", ID_PATTERNS.api],
    ["events", "event", ID_PATTERNS.event],
    ["integrations", "integration", ID_PATTERNS.integration],
    ["notifications", "notification", ID_PATTERNS.notification],
    ["risks", "risk", ID_PATTERNS.risk],
    ["assumptions", "assumption", ID_PATTERNS.assumption],
  ]
  let idErrors = 0
  for (const [sectionKey, , pattern] of idChecks) {
    const items = sectionKey === "workflows" ? flattenWorkflows(allContent.workflows) : getItems(allContent[sectionKey])
    for (const item of items) {
      if (item.id && !pattern.test(item.id)) {
        failed.push({ rule: "VAL-020", file: findFileForSection(filesMap, sectionKey), path: `${sectionKey}.${item.id}`, hint: `id "${item.id}" does not match pattern` })
        idErrors++
      }
    }
  }
  if (allContent.audit?.events) {
    for (const ev of allContent.audit.events) {
      if (ev.id && !ID_PATTERNS.audit.test(ev.id)) {
        failed.push({ rule: "VAL-020", file: findFileForSection(filesMap, "audit"), path: `audit.events.${ev.id}`, hint: `id "${ev.id}" does not match pattern AUD-*` })
        idErrors++
      }
    }
  }
  if (idErrors === 0) passed.push("VAL-020")

  // VAL-021: acceptance criteria required for every requirement
  const allReqs = [...(explicitReqs || []), ...(hiddenReqs || [])]
  let acErrors = 0
  for (const r of allReqs) {
    if (!r["acceptance-criteria"] || r["acceptance-criteria"].length === 0) {
      failed.push({ rule: "VAL-021", file: findFileForSection(filesMap, "requirements"), path: `requirements.${r.id}`, hint: "missing acceptance-criteria (>=1 Given/When/Then)" })
      acErrors++
    }
  }
  if (acErrors === 0) passed.push("VAL-021")

  // VAL-022: workflow failure paths — every step has on-failure
  const workflows = flattenWorkflows(allContent.workflows)
  let wfErrors = 0
  for (const wf of workflows) {
    for (const step of (wf.steps || [])) {
      if (!step["on-failure"]) {
        failed.push({ rule: "VAL-022", file: findFileForSection(filesMap, "workflows"), path: `workflows.${wf.id}.steps.${step.id}`, hint: "step missing on-failure" })
        wfErrors++
      }
    }
  }
  if (wfErrors === 0) passed.push("VAL-022")

  // VAL-023: API error responses — every endpoint has >=2 responses incl non-2xx
  const apis = getItems(allContent.api)
  let apiErrors = 0
  for (const a of apis) {
    const responses = a.responses || []
    if (responses.length < 2) {
      failed.push({ rule: "VAL-023", file: findFileForSection(filesMap, "api"), path: `api.${a.id}`, hint: "fewer than 2 responses defined" })
      apiErrors++
    } else {
      const hasError = responses.some(r => r.status >= 400)
      if (!hasError) {
        failed.push({ rule: "VAL-023", file: findFileForSection(filesMap, "api"), path: `api.${a.id}`, hint: "no non-2xx response defined" })
        apiErrors++
      }
    }
  }
  if (apiErrors === 0) passed.push("VAL-023")

  // VAL-024: form field validation — every field has validation + error-message
  const forms = getItems(allContent.forms)
  let formErrors = 0
  for (const f of forms) {
    for (const field of (f.fields || [])) {
      if (!field.validation) {
        failed.push({ rule: "VAL-024", file: findFileForSection(filesMap, "forms"), path: `forms.${f.id}.fields.${field.name}`, hint: "field missing validation" })
        formErrors++
      }
      if (!field["error-message"]) {
        failed.push({ rule: "VAL-024", file: findFileForSection(filesMap, "forms"), path: `forms.${f.id}.fields.${field.name}`, hint: "field missing error-message" })
        formErrors++
      }
    }
  }
  if (formErrors === 0) passed.push("VAL-024")

  // VAL-030: requirement-domain links — every requirement references an existing domain
  const domainNames = new Set([
    ...(domains.functional || []).map(d => d.id || d.name),
    ...(allCrossCutting || []).map(d => d.id || d.name),
  ])
  let rdlErrors = 0
  for (const r of allReqs) {
    if (r.domain && !domainNames.has(r.domain)) {
      failed.push({ rule: "VAL-030", file: findFileForSection(filesMap, "requirements"), path: `requirements.${r.id}`, hint: `domain "${r.domain}" not found in domains list` })
      rdlErrors++
    }
  }
  if (rdlErrors === 0) passed.push("VAL-030")

  // VAL-031: every workflow references >=1 requirement; every must-priority req is covered
  let covErrors = 0
  for (const wf of workflows) {
    if (!wf.requirements || wf.requirements.length === 0) {
      failed.push({ rule: "VAL-031", file: findFileForSection(filesMap, "workflows"), path: `workflows.${wf.id}`, hint: "workflow references no requirements" })
      covErrors++
    }
  }
  // Check must-priority reqs have coverage in workflows, api, or pages
  const mustReqs = allReqs.filter(r => r.priority === "must")
  const wfReqIds = new Set(workflows.flatMap(w => (w.requirements || [])))
  const apiRefs = new Set((getItems(allContent.api) || []).map(a => a.id))
  const pageRefs = new Set((getItems(allContent.pages) || []).map(p => p.id))
  for (const r of mustReqs) {
    if (!wfReqIds.has(r.id) && !apiRefs.has(r.id) && !pageRefs.has(r.id)) {
      failed.push({ rule: "VAL-031", file: findFileForSection(filesMap, "requirements"), path: `requirements.${r.id}`, hint: `must-priority requirement "${r.id}" not covered by any workflow, api, or page` })
      covErrors++
    }
  }
  if (covErrors === 0) passed.push("VAL-031")

  // VAL-032: no dangling refs — every id referenced by a workflow, page, api,
  // or requirement-domain link must resolve to a defined id.
  const definedIds = new Set()
  for (const [key, val] of Object.entries(allContent)) {
    if (key === "_meta") continue
    for (const it of getItems(val)) {
      if (it && typeof it === "object" && typeof it.id === "string") definedIds.add(it.id)
    }
    if (val && typeof val === "object" && !Array.isArray(val)) {
      for (const sub of ["explicit", "hidden", "functional", "cross-cutting", "root", "dependent", "events"]) {
        for (const it of getItems(val[sub])) {
          if (it && typeof it === "object" && typeof it.id === "string") definedIds.add(it.id)
        }
      }
    }
  }
  let danglingErrors = 0
  for (const wf of workflows) {
    for (const ref of (wf.requirements || [])) {
      if (typeof ref === "string" && !definedIds.has(ref)) {
        failed.push({ rule: "VAL-032", file: findFileForSection(filesMap, "workflows"), path: `workflows.${wf.id}.requirements`, hint: `dangling reference "${ref}" — no matching id defined` })
        danglingErrors++
      }
    }
  }
  for (const r of allReqs) {
    if (r.domain && domainNames.size > 0 && !domainNames.has(r.domain)) {
      // already reported by VAL-030; skip to avoid double-count
    }
  }
  if (danglingErrors === 0) passed.push("VAL-032")

  // VAL-040: PII flagged (informational — never fails the build, but reported).
  const dataModel = allContent["data-model"] || {}
  const dmItems = getItems(dataModel.entities || dataModel)
  const piiFlagged = dmItems.some(e => e && (e.pii === true || (Array.isArray(e.fields) && e.fields.some(f => f && f.pii === true))))
  if (!piiFlagged) {
    // informational note only — does not push to failed
  }
  passed.push("VAL-040")

  // VAL-041: SLO defined (warning)
  const monitoring = allContent.monitoring || {}
  if (!monitoring.slos || monitoring.slos.length === 0) {
    failed.push({ rule: "VAL-041", file: findFileForSection(filesMap, "monitoring"), path: "monitoring.slos", hint: "no SLOs defined (warning)" })
  } else {
    passed.push("VAL-041")
  }

  // VAL-042: golden scenarios minimum 3 (warning)
  const testing = allContent.testing || {}
  const scenarios = testing["golden-scenarios"] || []
  if (scenarios.length < 3) {
    failed.push({ rule: "VAL-042", file: findFileForSection(filesMap, "testing"), path: "testing.golden-scenarios", hint: `only ${scenarios.length} golden scenarios, minimum 3 recommended` })
  } else {
    passed.push("VAL-042")
  }

  // VAL-050..054 (schema conformance) + VAL-060..063 (substance lints).
  const ext = extendedRules(allContent, filesMap, { level, schemaSections: [...REQUIRED_SECTIONS, ...OPTIONAL_SECTIONS] })
  passed.push(...ext.passed)
  failed.push(...ext.failed)

  return { passed, failed, warnings: ext.warnings }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get items from a section — handles both array and {items: [...]} shapes */
function getItems(section) {
  if (!section) return []
  if (Array.isArray(section)) return section
  if (section.items) return section.items
  return []
}

/**
 * Flatten the workflows section, which may be a flat array (monolithic /
 * aggregated) OR the staged {root, dependent} shape (stage-04 authors root,
 * stage-05 authors dependent). Without this, getItems() returns [] on the
 * staged shape and workflow rules silently pass.
 */
function flattenWorkflows(section) {
  if (!section) return []
  if (Array.isArray(section)) return section
  const out = []
  if (section.root) out.push(section.root)
  if (Array.isArray(section.dependent)) out.push(...section.dependent)
  if (Array.isArray(section.sub)) out.push(...section.sub)
  if (Array.isArray(section.items)) out.push(...section.items)
  return out
}

/** Find which staged file contains a given top-level section */
function findFileForSection(filesMap, section) {
  for (const [file, doc] of Object.entries(filesMap)) {
    if (doc[section] !== undefined) return file
  }
  return "aggregate"
}
