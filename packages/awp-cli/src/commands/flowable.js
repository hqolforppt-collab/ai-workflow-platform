/**
 * flowable.js — awp flowable convert|deploy|validate commands.
 *
 * convert:  reads staged blueprint YAML, converts to Flowable-native formats
 *           (BPMN 2.0 XML, CMMN 1.1 XML, DMN 1.3 XML, Flowable Form JSON).
 * deploy:   gate-checks G1-G4, then deploys converted artifacts to a running
 *           Flowable engine via REST API.
 * validate: convert in-memory + dry-run deploy (validate only, no engine mutation).
 *
 * Requires FLOWABLE_URL, FLOWABLE_USER, FLOWABLE_PASS in environment
 * (or configured via .awp/config.yaml env-var names).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs"
import { join, basename } from "node:path"
import { requireRepoRoot, tryReadYaml } from "../lib/repo.js"
import { loadModelConfig } from "../model.js"
import { checkGates, resolveBlueprintId } from "../../../awp-governance/src/index.js"

// ---------------------------------------------------------------------------
// convert
// ---------------------------------------------------------------------------

export async function flowableConvert(flags) {
  const root = requireRepoRoot()
  const targetDir = flags._[0]
  if (!targetDir) {
    console.error("awp flowable convert: <blueprint-dir> is required")
    return 1
  }

  const bpDir = join(root, targetDir)
  if (!existsSync(bpDir)) {
    console.error(`awp flowable convert: directory not found: ${bpDir}`)
    return 1
  }

  const outDir = typeof flags.out === "string" ? flags.out : join(bpDir, "flowable")
  mkdirSync(outDir, { recursive: true })

  // Load sections from staged files OR a monolithic blueprint.yaml (G6).
  const { sections, blueprintId } = loadBlueprintSections(bpDir)
  const manifest = { blueprint_id: blueprintId, deployed_at: new Date().toISOString(), artifacts: [] }

  const emit = (file, type, key, content) => {
    const fp = join(outDir, file)
    writeFileSync(fp, content)
    manifest.artifacts.push({ file: basename(fp), type, key })
  }

  const bpSlug = slugify((blueprintId || "workflow").replace(/^BLU-/i, ""))
  const workflows = sections.workflows || {}
  const rootModelType = sections.root_model?.type || sections._meta?.root_model_type || "BPMN"

  // Root workflow: workflows.root, else first entry of a flat workflows list.
  const flatWfs = getItems(workflows)
  const rootWf = workflows.root || (flatWfs.length ? flatWfs[0] : null)
  if (rootWf) {
    const key = workflowKey(rootWf, `${bpSlug}-root`)
    if (/cmmn|case/i.test(rootModelType)) {
      emit(`${key}.cmmn.xml`, "cmmn.xml", key, yamlToCmmn(rootWf, key))
    } else {
      emit(`${key}.bpmn20.xml`, "bpmn20.xml", key, yamlToBpmn(rootWf, key))
    }
  }

  // Dependent workflows: workflows.dependent[]/sub[], else remaining flat entries.
  const depWfs = getItems(workflows.dependent || workflows.sub)
  const flatDeps = workflows.root ? [] : flatWfs.slice(1)
  for (const wf of [...depWfs, ...flatDeps]) {
    const key = workflowKey(wf, slugify(wf.name || "dependent"))
    emit(`${key}.bpmn20.xml`, "bpmn20.xml", key, yamlToBpmn(wf, key))
  }

  // DMN decision tables (top-level or nested under workflows).
  const dmnTables = getItems(sections["decision-tables"] || sections.dmn || workflows["decision-tables"])
  for (const dt of dmnTables) {
    const key = workflowKey(dt, slugify(dt.name || "decision"))
    emit(`${key}.dmn`, "dmn", key, yamlToDmn(dt, key))
  }

  // Forms (stage 06).
  const forms = getItems(sections.forms)
  for (const form of forms) {
    const key = workflowKey(form, slugify(form.name || "form"))
    emit(`${key}.form.json`, "form.json", key, JSON.stringify(yamlToFormJson(form, key), null, 2))
  }

  // Write manifest
  const manifestPath = join(outDir, "deploy-manifest.json")
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

  console.log(`awp flowable convert: ${manifest.artifacts.length} artifacts → ${outDir}/`)
  for (const a of manifest.artifacts) {
    console.log(`  ${a.file.padEnd(36)} ${a.type.padEnd(12)} key: ${a.key}`)
  }
  console.log(`  deploy-manifest.json`)

  return 0
}

// ---------------------------------------------------------------------------
// deploy
// ---------------------------------------------------------------------------

export async function flowableDeploy(flags) {
  const root = requireRepoRoot()
  const targetDir = flags._[0]
  if (!targetDir) {
    console.error("awp flowable deploy: <blueprint-dir> is required")
    return 1
  }

  const bpDir = join(root, targetDir)
  if (!existsSync(bpDir)) {
    console.error(`awp flowable deploy: directory not found: ${bpDir}`)
    return 1
  }

  // Gate check (shared, fail-closed — same module the MCP server uses)
  const blueprintId = resolveBlueprintId(bpDir)
  const gateStatus = checkGates(root, { bpDir, blueprintId })
  if (!gateStatus.ok) {
    console.error(`awp flowable deploy: GATE CHECK FAILED`)
    console.error(`  ${gateStatus.reason}`)
    return 1
  }
  console.log(`  gate-check: ${gateStatus.summary}  (blueprint ${gateStatus.blueprintId})`)

  // Ensure converted artifacts exist
  const flowableDir = join(bpDir, "flowable")
  if (!existsSync(flowableDir)) {
    console.log("  artifacts not yet converted — running awp flowable convert...")
    await flowableConvert({ ...flags, _: [targetDir], out: flowableDir })
  }

  const config = loadModelConfig(root)
  const baseUrl = process.env[config.flowableUrlEnv] || "http://localhost:8080/flowable-rest"
  const user = process.env[config.flowableUserEnv] || "rest-admin"
  const pass = process.env[config.flowablePassEnv] || "test"

  console.log(`Deploying to Flowable @ ${baseUrl} ...`)

  // Health check
  try {
    const hc = await fetch(`${baseUrl}/service/management/engine`, {
      headers: { Authorization: basicAuth(user, pass) },
    })
    if (!hc.ok) throw new Error(`HTTP ${hc.status}`)
    const hcData = await hc.json()
    console.log(`  engine: ${hcData.version || "unknown"} ✓`)
  } catch (err) {
    console.error(`  engine health check failed: ${err.message}`)
    console.error("  Make sure a Flowable REST instance is running.")
    return 1
  }

  // Deploy each artifact
  const manifest = tryReadYaml(join(flowableDir, "deploy-manifest.json")) || tryReadYaml(join(flowableDir, "deploy-manifest.json"))
  const artifacts = manifest?.artifacts || []
  let success = 0
  let failures = 0

  for (const art of artifacts) {
    const fp = join(flowableDir, art.file)
    if (!existsSync(fp)) {
      console.log(`  SKIP   ${art.file} — file not found`)
      failures++
      continue
    }

    try {
      const content = readFileSync(fp, "utf8")
      const formData = new FormData()
      const blob = new Blob([content], { type: art.type.includes("json") ? "application/json" : "text/xml" })
      formData.append("file", blob, art.file)

      const res = await fetch(`${baseUrl}/service/repository/deployments`, {
        method: "POST",
        headers: { Authorization: basicAuth(user, pass) },
        body: formData,
      })

      if (res.status !== 201) {
        const body = await res.text().catch(() => "")
        console.log(`  FAIL   ${art.file} — HTTP ${res.status}: ${body.slice(0, 200)}`)
        failures++
        continue
      }

      const dep = await res.json()
      let extra = ""
      if (art.type === "bpmn20.xml" || art.type === "cmmn.xml") {
        // Check process definitions registered
        const defsRes = await fetch(
          `${baseUrl}/service/repository/process-definitions?deploymentId=${dep.id}`,
          { headers: { Authorization: basicAuth(user, pass) } }
        )
        const defs = await defsRes.json()
        if (defs.data?.length) {
          extra = `→ def key ${defs.data[0].key} v${defs.data[0].version}`
        }
      }
      console.log(`  ✓ ${art.file.padEnd(36)} deployment ${dep.id} ${extra}`)
      success++
    } catch (err) {
      console.log(`  FAIL   ${art.file} — ${err.message}`)
      failures++
    }
  }

  // Write deploy report
  const report = {
    blueprint_id: blueprintId,
    deployed_at: new Date().toISOString(),
    gateway: baseUrl,
    success,
    failures,
    artifacts: artifacts.map(a => ({ ...a, status: existsSync(join(flowableDir, a.file)) ? "deployed" : "missing" })),
  }
  writeFileSync(join(flowableDir, "deploy-report.json"), JSON.stringify(report, null, 2))

  console.log(`\n${success} deployed, ${failures} failed → ${flowableDir}/deploy-report.json`)
  return failures > 0 ? 1 : 0
}

// ---------------------------------------------------------------------------
// validate (dry-run deploy)
// ---------------------------------------------------------------------------

export async function flowableValidate(flags) {
  const root = requireRepoRoot()
  const targetDir = flags._[0]
  if (!targetDir) {
    console.error("awp flowable validate: <blueprint-dir> is required")
    return 1
  }

  const config = loadModelConfig(root)
  const baseUrl = process.env[config.flowableUrlEnv] || "http://localhost:8080/flowable-rest"
  const user = process.env[config.flowableUserEnv] || "rest-admin"
  const pass = process.env[config.flowablePassEnv] || "test"

  const bpDir = join(root, targetDir)
  const flowableDir = join(bpDir, "flowable")

  // Convert first if needed
  if (!existsSync(flowableDir)) {
    console.log("  artifacts not yet converted — running awp flowable convert...")
    await flowableConvert({ ...flags, _: [targetDir], out: flowableDir })
  }

  const manifest = tryReadYaml(join(flowableDir, "deploy-manifest.json"))
  const artifacts = manifest?.artifacts || []

  console.log(`Validating ${artifacts.length} artifacts against Flowable @ ${baseUrl} ...`)

  let valid = 0
  let invalid = 0

  // Route each artifact to the engine that owns it. Deploying to the real
  // engine is the strongest validity proof — it parses, validates, and compiles
  // the model — and we delete the test deployment immediately so validation
  // stays non-mutating. If an engine's REST API is not mounted in the target
  // image (404) we fall back to a structural check and say so — never a silent
  // pass. CMMN has no engine route here yet, so it gets the structural check.
  const auth = basicAuth(user, pass)
  const ENDPOINTS = {
    "bpmn20.xml": { api: "/service/repository/deployments", cascade: true, ct: "text/xml", engine: "process" },
    dmn: { api: "/dmn-api/dmn-repository/deployments", ct: "text/xml", engine: "DMN" },
    "form.json": { api: "/form-api/form-repository/deployments", ct: "application/json", engine: "form", resource: (f) => f.replace(/\.json$/, "") },
  }

  const structural = (art, content) => {
    const err = structuralError(art.type, content)
    if (err) {
      console.log(`  ✗ ${art.file} — malformed: ${err}`)
      invalid++
    } else {
      console.log(`  ⚠ ${art.file} — valid (structural only)`)
      valid++
    }
  }

  for (const art of artifacts) {
    const fp = join(flowableDir, art.file)
    if (!existsSync(fp)) {
      console.log(`  SKIP   ${art.file} — file not found`)
      continue
    }

    const content = readFileSync(fp, "utf8")
    const ep = ENDPOINTS[art.type]
    if (!ep) {
      structural(art, content) // no owning engine (e.g. CMMN)
      continue
    }

    try {
      const resource = ep.resource ? ep.resource(art.file) : art.file
      const form = new FormData()
      form.append("file", new Blob([content], { type: ep.ct }), resource)
      const res = await fetch(`${baseUrl}${ep.api}`, { method: "POST", headers: { Authorization: auth }, body: form })

      if (res.status === 201) {
        const dep = await res.json().catch(() => ({}))
        if (dep.id) {
          // Clean up the test deployment (non-mutating validation).
          const q = ep.cascade ? "?cascade=true" : ""
          await fetch(`${baseUrl}${ep.api}/${dep.id}${q}`, { method: "DELETE", headers: { Authorization: auth } })
        }
        console.log(`  ✓ ${art.file} — valid (deployed to live ${ep.engine} engine)`)
        valid++
      } else if (res.status === 404) {
        // That engine's REST API is not mounted in this image — be honest.
        const err = structuralError(art.type, content)
        if (err) {
          console.log(`  ✗ ${art.file} — malformed: ${err}`)
          invalid++
        } else {
          console.log(`  ⚠ ${art.file} — valid (structural; ${ep.engine} REST API not available at ${ep.api})`)
          valid++
        }
      } else {
        const body = await res.text().catch(() => "")
        console.log(`  ✗ ${art.file} — rejected by ${ep.engine} engine (HTTP ${res.status}): ${body.slice(0, 200)}`)
        invalid++
      }
    } catch (err) {
      console.log(`  ✗ ${art.file} — error: ${err.message}`)
      invalid++
    }
  }

  console.log(`\n${valid} valid, ${invalid} invalid`)
  return invalid > 0 ? 1 : 0
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getItems(section) {
  if (!section) return []
  if (Array.isArray(section)) return section
  if (section.items) return section.items
  return []
}

function slugify(text) {
  return (text || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}

/** Derive a stable Flowable definition key from a model's own id/name. */
function workflowKey(model, fallback) {
  if (model && model.id) return slugify(model.id)
  if (model && model.name) return slugify(model.name)
  return fallback
}

function basicAuth(user, pass) {
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64")
}

/**
 * Structural well-formedness check for artifacts the process-engine deployment
 * endpoint can't accept (DMN, Form, CMMN). Returns an error string if the
 * artifact is malformed, or null if it passes. This is deliberately a
 * structural check, not live-engine validation — see flowableValidate.
 */
function structuralError(type, content) {
  if (type.includes("json")) {
    let doc
    try {
      doc = JSON.parse(content)
    } catch (e) {
      return `invalid JSON (${e.message})`
    }
    if (!doc || !Array.isArray(doc.fields)) return "form definition missing a fields[] array"
    return null
  }
  // XML artifacts (dmn, cmmn.xml): must be a well-formed <definitions> document
  // with the expected root model element.
  if (!/<definitions[\s>]/.test(content)) return "missing <definitions> root"
  if (type === "dmn" && !/<decision[\s>]/.test(content)) return "DMN missing a <decision>"
  if (type === "cmmn.xml" && !/<case[\s>]/.test(content)) return "CMMN missing a <case>"
  return null
}

/**
 * Load blueprint sections from either staged files (01..06-*.yaml) or a
 * monolithic blueprint.yaml. Returns a flat section map plus the resolved
 * blueprint id so the converter behaves identically on both output shapes
 * (the v2.0 converter only read staged files, so it emitted nothing useful on
 * the monolithic golden example — audit gap G6).
 */
function loadBlueprintSections(bpDir) {
  const staged = readdirSync(bpDir)
    .filter((f) => /^\d{2}-.*\.yaml$/.test(f))
    .sort()

  const sections = {}
  if (staged.length > 0) {
    for (const entry of staged) {
      const doc = tryReadYaml(join(bpDir, entry)) || {}
      for (const [key, val] of Object.entries(doc)) {
        // Merge the workflows key (root in stage-04, dependent in stage-05)
        // instead of letting a later file clobber the root workflow.
        if (key === "workflows" && sections.workflows && typeof val === "object" && !Array.isArray(val)) {
          sections.workflows = { ...sections.workflows, ...val }
        } else {
          sections[key] = val
        }
      }
    }
  } else {
    const mono = join(bpDir, "blueprint.yaml")
    if (existsSync(mono)) Object.assign(sections, tryReadYaml(mono) || {})
  }
  return { sections, blueprintId: resolveBlueprintId(bpDir) }
}

// ---------------------------------------------------------------------------
// YAML → BPMN 2.0 XML converter (structural — reuses proven patterns from
// scripts/bpmn-roundtrip.mjs and scripts/flowable-deploy-test.mjs)
// ---------------------------------------------------------------------------

// Flowable's `flowable-executable-process` validation set refuses to deploy a
// service/send task that has no implementation (one of class / expression /
// delegateExpression / type). A blueprint is a spec, not wired to real Java
// delegates, so we emit a JUEL expression — the same proven-deployable pattern
// the hand-written login-flow.bpmn20.xml uses. An explicit implementation on
// the step (expression / delegateExpression / class) always wins; otherwise we
// synthesize a stable, valid placeholder bound to the step id.
function taskImplAttr(step, stepId, defaultBean) {
  if (step.expression) {
    const e = /^\$\{.*\}$/.test(step.expression) ? step.expression : `\${${step.expression}}`
    return ` flowable:expression="${xmlAttr(e)}"`
  }
  if (step.delegateExpression) return ` flowable:delegateExpression="${xmlAttr(step.delegateExpression)}"`
  if (step.class || step.implementation) return ` flowable:class="${xmlAttr(step.class || step.implementation)}"`
  return ` flowable:expression="\${${defaultBean}.execute('${xmlAttr(stepId)}')}"`
}

// Minimal XML attribute escaper (the converter previously emitted raw values).
function xmlAttr(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// XML text-node escaper (element content; quotes need not be escaped).
function xmlText(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function yamlToBpmn(wf, key) {
  const steps = getItems(wf.steps || wf)
  const name = wf.name || key
  const processId = wf.id || `${key}-process`

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             xmlns:flowable="http://flowable.org/bpmn"
             targetNamespace="http://flowable.org/process">
  <process id="${processId}" name="${name}" isExecutable="true">
`

  if (steps.length === 0) {
    xml += `    <startEvent id="start" name="Start"/>\n`
    xml += `    <endEvent id="end" name="End"/>\n`
    xml += `    <sequenceFlow id="flow1" sourceRef="start" targetRef="end"/>\n`
  } else {
    xml += `    <startEvent id="start" name="Start"/>\n`
    let prevId = "start"
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const stepId = step.id || `step${i + 1}`
      const stepName = step.name || stepId
      const stepType = step.type || "user-action"

      if (stepType === "user-action" || stepType === "user-task") {
        xml += `    <userTask id="${stepId}" name="${stepName}" flowable:assignee="${step.actor || ""}"/>\n`
      } else if (stepType === "system-action" || stepType === "service-task") {
        xml += `    <serviceTask id="${stepId}" name="${stepName}"${taskImplAttr(step, stepId, "awpService")}/>\n`
      } else if (stepType === "decision" || stepType === "exclusive-gateway") {
        xml += `    <exclusiveGateway id="${stepId}" name="${stepName}"/>\n`
      } else if (stepType === "notification" || stepType === "send-task") {
        // Flowable's <sendTask> requires a bound `type` (mail) or `operation`
        // (web-service) — it rejects a plain expression. A blueprint has no
        // mail/WS binding yet, so emit the notification as an expression-backed
        // <serviceTask> (proven deployable) that names the notifier service.
        xml += `    <serviceTask id="${stepId}" name="${stepName}"${taskImplAttr(step, stepId, "awpNotifier")}/>\n`
      } else {
        xml += `    <userTask id="${stepId}" name="${stepName}"/>\n`
      }

      xml += `    <sequenceFlow id="flow_${prevId}_${stepId}" sourceRef="${prevId}" targetRef="${stepId}"/>\n`
      prevId = stepId
    }
    xml += `    <endEvent id="end" name="End"/>\n`
    xml += `    <sequenceFlow id="flow_${prevId}_end" sourceRef="${prevId}" targetRef="end"/>\n`
  }

  xml += `  </process>\n</definitions>\n`
  return xml
}

function yamlToCmmn(wf, key) {
  const name = wf.name || key
  const caseId = wf.id || `${key}-case`
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/CMMN/20151109/MODEL"
             targetNamespace="http://flowable.org/cmmn">
  <case id="${caseId}" name="${name}">
    <casePlanModel id="${caseId}Plan" name="${name} Plan">
      <planItem id="pi1" definitionRef="task1"/>
      <humanTask id="task1" name="${name} Task"/>
    </casePlanModel>
  </case>
</definitions>
`
}

// ---------------------------------------------------------------------------
// DMN 1.3 generation — a real decision table the Flowable DMN engine deploys,
// not a stub. Inputs carry a typed <inputExpression>; every rule is expanded
// into one <inputEntry> per input column and one <outputEntry> per output,
// parsed from the blueprint's when/then grammar.
// ---------------------------------------------------------------------------

const DMN_NS = "https://www.omg.org/spec/DMN/20191111/MODEL/"

/** blueprint type → DMN FEEL typeRef. */
function dmnTypeRef(t) {
  switch (String(t || "string").toLowerCase()) {
    case "number":
    case "integer":
    case "long":
    case "double":
      return "number"
    case "boolean":
    case "bool":
      return "boolean"
    case "date":
    case "datetime":
      return "date"
    default:
      return "string"
  }
}

/** Render a raw blueprint value as a FEEL literal (used in output/equality entries). */
function feelLiteral(raw) {
  const r = String(raw ?? "").trim()
  const q = r.match(/^'(.*)'$/s) || r.match(/^"(.*)"$/s)
  if (q) return `"${q[1].replace(/"/g, '\\"')}"`
  if (/^(true|false)$/i.test(r)) return r.toLowerCase()
  if (/^-?\d+(\.\d+)?$/.test(r)) return r
  return `"${r.replace(/"/g, '\\"')}"` // bare token → string literal
}

/** Build a FEEL unary test for an input cell from an operator + value. */
function feelUnaryTest(op, raw) {
  const v = feelLiteral(raw)
  if (op === "=") return v // equality is expressed as the bare literal
  if (op === "!=") return `not(${v})`
  return `${op} ${v}` // >=, <=, >, <
}

/** Parse a rule `when` into one unary test per input column ("-" = any). */
function parseWhen(when, inputs) {
  const w = String(when ?? "").trim()
  const byExpr = {}
  if (w && !/^otherwise$/i.test(w)) {
    for (const term of w.split(/\s+and\s+/i)) {
      const m = term.trim().match(/^(.+?)\s*(>=|<=|!=|=|>|<)\s*(.+)$/)
      if (m) byExpr[m[1].trim()] = feelUnaryTest(m[2], m[3].trim())
    }
  }
  return inputs.map((inp, i) => byExpr[inp.expression || inp.id || `input${i + 1}`] ?? "-")
}

/** Parse a rule `then` into one FEEL literal per output column. */
function parseThen(then, outputs) {
  const t = String(then ?? "").trim()
  if (t.includes("=")) {
    const byName = {}
    for (const part of t.split(",")) {
      const m = part.trim().match(/^(.+?)\s*=\s*(.+)$/)
      if (m) byName[m[1].trim()] = feelLiteral(m[2].trim())
    }
    return outputs.map((o, i) => byName[o.name || o.id || `output${i + 1}`] ?? '""')
  }
  // A single bare outcome value populates the (single) output column.
  return outputs.map((o, i) => (i === 0 && t ? feelLiteral(t) : '""'))
}

export function yamlToDmn(dt, key) {
  const name = dt.name || key
  const decId = dt.id || `${key}-decision`
  const tableId = `${decId}-table`
  const hitPolicy = String(dt["hit-policy"] || dt.hitPolicy || "FIRST").toUpperCase()

  const inputs = getItems(dt.inputs)
  const outputs = getItems(dt.outputs)
  const rules = getItems(dt.rules)

  // A decision table must have at least one input and output to be valid.
  const inDefs = inputs.length ? inputs : [{ id: "input1", label: "Input", expression: "input", type: "string" }]
  const outDefs = outputs.length ? outputs : [{ id: "output1", label: "Output", name: "output", type: "string" }]

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<definitions xmlns="${DMN_NS}" id="definitions_${xmlAttr(decId)}" name="${xmlAttr(name)}" namespace="http://flowable.org/dmn">\n`
  xml += `  <decision id="${xmlAttr(decId)}" name="${xmlAttr(name)}">\n`
  xml += `    <decisionTable id="${xmlAttr(tableId)}" hitPolicy="${hitPolicy}">\n`

  inDefs.forEach((inp, i) => {
    const id = inp.id || `input${i + 1}`
    xml += `      <input id="${xmlAttr(id)}" label="${xmlAttr(inp.label || id)}">\n`
    xml += `        <inputExpression id="${xmlAttr(id)}_expr" typeRef="${dmnTypeRef(inp.type)}">\n`
    xml += `          <text>${xmlText(inp.expression || inp.label || id)}</text>\n`
    xml += `        </inputExpression>\n`
    xml += `      </input>\n`
  })

  outDefs.forEach((out, i) => {
    const id = out.id || `output${i + 1}`
    xml += `      <output id="${xmlAttr(id)}" label="${xmlAttr(out.label || id)}" name="${xmlAttr(out.name || id)}" typeRef="${dmnTypeRef(out.type)}"/>\n`
  })

  rules.forEach((rule, i) => {
    const rid = rule.id || `rule${i + 1}`
    const ins = parseWhen(rule.when, inDefs)
    const outs = parseThen(rule.then, outDefs)
    xml += `      <rule id="${xmlAttr(rid)}">\n`
    if (rule.description) xml += `        <description>${xmlText(rule.description)}</description>\n`
    ins.forEach((t) => (xml += `        <inputEntry><text>${xmlText(t)}</text></inputEntry>\n`))
    outs.forEach((t) => (xml += `        <outputEntry><text>${xmlText(t)}</text></outputEntry>\n`))
    xml += `      </rule>\n`
  })

  xml += `    </decisionTable>\n  </decision>\n</definitions>\n`
  return xml
}

/** blueprint field type → Flowable form-engine field type. */
function flowableFormType(t) {
  switch (String(t || "text").toLowerCase()) {
    case "email":
    case "password":
    case "tel":
    case "phone":
    case "url":
    case "string":
    case "text":
      return "text"
    case "textarea":
    case "multiline":
    case "multi-line-text":
      return "multi-line-text"
    case "number":
    case "integer":
    case "amount":
      return "number"
    case "checkbox":
    case "boolean":
    case "bool":
      return "boolean"
    case "date":
    case "datetime":
      return "date"
    case "select":
    case "dropdown":
      return "dropdown"
    case "radio":
    case "radio-buttons":
      return "radio-buttons"
    case "upload":
    case "file":
      return "upload"
    default:
      return "text"
  }
}

// Emit a Flowable form-engine FormModel (the shape a `.form` resource carries).
// Deployed to /form-api/form-repository, this is a real, engine-parseable form
// definition — not the ad-hoc shape the previous converter produced.
export function yamlToFormJson(form, key) {
  const fields = getItems(form.fields).map((f, i) => {
    const id = f.name || f.id || `field${i + 1}`
    return {
      id,
      name: f.label || f.name || id,
      type: flowableFormType(f.type),
      value: null,
      required: f.required !== false,
      readOnly: false,
      overrideId: true,
      placeholder: f.placeholder || f.label || "",
      layout: null,
    }
  })

  return {
    key: form.id || key,
    name: form.name || key,
    version: 0,
    fields,
    outcomes: [],
    outcomeVariableName: null,
  }
}
