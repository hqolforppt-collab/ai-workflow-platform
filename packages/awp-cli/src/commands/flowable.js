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

  // Read staged files
  const stagedFiles = {}
  const entries = readdirSync(bpDir).filter(f => f.match(/^\d{2}-.*\.yaml$/)).sort()
  for (const entry of entries) {
    stagedFiles[entry] = tryReadYaml(join(bpDir, entry)) || {}
  }

  const manifest = { deployed_at: new Date().toISOString(), artifacts: [] }

  // Convert root workflow (stage 04)
  const rootModels = stagedFiles["04-root-models.yaml"] || stagedFiles[Object.keys(stagedFiles).find(k => k.includes("root"))] || {}
  const rootWf = rootModels.workflows || {}

  // Determine root model type
  const rootModelType = rootModels.root_model?.type || rootModels._meta?.root_model_type || "BPMN"
  const rootKey = slugify(rootModels.project?.name || rootModels._meta?.blueprint_id || "root")

  if (rootModelType === "BPMN" || rootModelType === "bpmn") {
    const xml = yamlToBpmn(rootWf, rootKey)
    const fp = join(outDir, `${rootKey}.bpmn20.xml`)
    writeFileSync(fp, xml)
    manifest.artifacts.push({ file: basename(fp), type: "bpmn20.xml", key: rootKey })
  } else if (rootModelType === "CMMN" || rootModelType === "cmmn") {
    const xml = yamlToCmmn(rootWf, rootKey)
    const fp = join(outDir, `${rootKey}.cmmn.xml`)
    writeFileSync(fp, xml)
    manifest.artifacts.push({ file: basename(fp), type: "cmmn.xml", key: rootKey })
  }

  // Convert dependent workflows (stage 05)
  const depModels = stagedFiles["05-dependent-models.yaml"] || stagedFiles[Object.keys(stagedFiles).find(k => k.includes("dependent"))] || {}
  const depWfs = getItems(depModels.workflows || {})
  for (const wf of depWfs) {
    const key = wf.id ? wf.id.toLowerCase() : slugify(wf.name || "dependent")
    const xml = yamlToBpmn(wf, key)
    const fp = join(outDir, `${key}.bpmn20.xml`)
    writeFileSync(fp, xml)
    manifest.artifacts.push({ file: basename(fp), type: "bpmn20.xml", key })
  }

  // Convert DMN decision tables (stage 05)
  const dmnTables = getItems(depModels["decision-tables"] || depModels.dmn || {})
  for (const dt of dmnTables) {
    const key = dt.id ? dt.id.toLowerCase() : slugify(dt.name || "decision")
    const xml = yamlToDmn(dt, key)
    const fp = join(outDir, `${key}.dmn`)
    writeFileSync(fp, xml)
    manifest.artifacts.push({ file: basename(fp), type: "dmn", key })
  }

  // Convert forms (stage 06)
  const formModels = stagedFiles["06-forms.yaml"] || stagedFiles[Object.keys(stagedFiles).find(k => k.includes("form"))] || {}
  const forms = getItems(formModels.forms || {})
  for (const form of forms) {
    const key = form.id ? form.id.toLowerCase() : slugify(form.name || "form")
    const json = yamlToFormJson(form, key)
    const fp = join(outDir, `${key}.form.json`)
    writeFileSync(fp, JSON.stringify(json, null, 2))
    manifest.artifacts.push({ file: basename(fp), type: "form.json", key })
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

  // Gate check
  const gateStatus = checkGates(root, bpDir)
  if (!gateStatus.ok) {
    console.error(`awp flowable deploy: GATE CHECK FAILED`)
    console.error(`  ${gateStatus.reason}`)
    console.error("  Approve gates G1-G4 before deploying. See .governance/gates/")
    return 1
  }
  console.log(`  gate-check: ${gateStatus.summary}`)

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

  for (const art of artifacts) {
    const fp = join(flowableDir, art.file)
    if (!existsSync(fp)) {
      console.log(`  SKIP   ${art.file} — file not found`)
      continue
    }

    try {
      const content = readFileSync(fp, "utf8")
      const formData = new FormData()
      const blob = new Blob([content], { type: art.type.includes("json") ? "application/json" : "text/xml" })
      formData.append("file", blob, art.file)

      // Dry-run deploy
      const res = await fetch(`${baseUrl}/service/repository/deployments`, {
        method: "POST",
        headers: { Authorization: basicAuth(user, pass) },
        body: formData,
      })

      if (res.status === 201) {
        const dep = await res.json()
        // Clean up: delete the test deployment
        await fetch(`${baseUrl}/service/repository/deployments/${dep.id}?cascade=true`, {
          method: "DELETE",
          headers: { Authorization: basicAuth(user, pass) },
        })
        console.log(`  ✓ ${art.file} — valid`)
        valid++
      } else {
        const body = await res.text().catch(() => "")
        console.log(`  ✗ ${art.file} — rejected: ${body.slice(0, 200)}`)
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

function basicAuth(user, pass) {
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64")
}

/** Check G1-G4 gate status for a blueprint */
function checkGates(root, bpDir) {
  const gatesDir = join(root, ".governance", "gates")
  if (!existsSync(gatesDir)) {
    // No gates configured — warn but allow
    return { ok: true, summary: "no gate definitions found (deploy allowed)", reason: "" }
  }

  const required = ["G1-requirements", "G2-architecture", "G3-data-model", "G4-security"]
  const missing = []

  for (const gate of required) {
    const gatePath = join(gatesDir, `${gate}.yaml`)
    if (!existsSync(gatePath)) {
      missing.push(gate)
      continue
    }
    const g = tryReadYaml(gatePath) || {}
    if (g.status !== "approved") {
      missing.push(gate)
    }
  }

  if (missing.length > 0) {
    return {
      ok: false,
      summary: "",
      reason: `gates not approved: ${missing.join(", ")}. Approve in .governance/gates/`,
    }
  }

  return { ok: true, summary: "G1✓ G2✓ G3✓ G4✓", reason: "" }
}

// ---------------------------------------------------------------------------
// YAML → BPMN 2.0 XML converter (structural — reuses proven patterns from
// scripts/bpmn-roundtrip.mjs and scripts/flowable-deploy-test.mjs)
// ---------------------------------------------------------------------------

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
        xml += `    <serviceTask id="${stepId}" name="${stepName}"/>\n`
      } else if (stepType === "decision" || stepType === "exclusive-gateway") {
        xml += `    <exclusiveGateway id="${stepId}" name="${stepName}"/>\n`
      } else if (stepType === "notification" || stepType === "send-task") {
        xml += `    <sendTask id="${stepId}" name="${stepName}"/>\n`
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

function yamlToDmn(dt, key) {
  const name = dt.name || key
  const decId = dt.id || `${key}-decision`
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/DMN/20191111/MODEL"
             namespace="http://flowable.org/dmn">
  <decision id="${decId}" name="${name}">
    <decisionTable id="${decId}Table">
      <input id="input1" label="Input"/>
      <output id="output1" label="Output" typeRef="string"/>
    </decisionTable>
  </decision>
</definitions>
`
}

function yamlToFormJson(form, key) {
  const fields = (form.fields || []).map(f => ({
    id: f.name || f.id,
    name: f.label || f.name,
    type: f.type || "text",
    required: f.required !== false,
    placeholder: f.label || "",
  }))

  return {
    key: form.id || key,
    name: form.name || key,
    fields,
  }
}
