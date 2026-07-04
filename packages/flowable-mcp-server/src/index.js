/**
 * flowable-mcp-server — MCP stdio server exposing Flowable REST API as tools.
 *
 * 8 tools: health_check, deploy, validate_bpmn, list_processes,
 *          start_process, query_tasks, complete_task, get_form.
 *
 * Config via env vars: FLOWABLE_URL, FLOWABLE_USER, FLOWABLE_PASS.
 * Node 18+ — uses global fetch().
 */
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { checkGates, checkRuntimeMutation } from "../../awp-governance/src/index.js"
import { resolveFlowableEnv, makeClient } from "./client.js"

const { base: BASE, auth: AUTH } = resolveFlowableEnv()
const client = makeClient({ base: BASE, auth: AUTH })

/** Walk up from cwd to the repo root (the dir holding .governance/). */
function findRepoRoot(start = process.cwd()) {
  let dir = start
  for (let i = 0; i < 40; i++) {
    if (existsSync(join(dir, ".governance")) || existsSync(join(dir, ".ai"))) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return start
}

const REPO_ROOT = findRepoRoot()

/** Resolve a blueprint id from an explicit param or a deploy-manifest.json among the files. */
function blueprintIdFromFiles(explicit, files) {
  if (explicit) return explicit
  for (const f of files || []) {
    if (/deploy-manifest\.json$/.test(f.name)) {
      try {
        const m = JSON.parse(f.content)
        if (m && m.blueprint_id) return m.blueprint_id
      } catch {
        /* ignore malformed manifest */
      }
    }
  }
  return null
}

function refusal(text) {
  return { content: [{ type: "text", text: JSON.stringify({ refused: true, reason: text }, null, 2) }] }
}

const api = client.api

const server = new McpServer({
  name: "flowable-mcp-server",
  version: "0.1.0",
})

// ---------------------------------------------------------------------------
// 1. health_check
// ---------------------------------------------------------------------------
server.tool(
  "health_check",
  "Check Flowable engine connectivity and version",
  {},
  async () => {
    const r = await api("GET", "/service/management/engine")
    if (r.status === 200) {
      return {
        content: [{ type: "text", text: JSON.stringify({
          ok: true,
          engine: r.data?.name || "Flowable",
          version: r.data?.version || "unknown",
          url: BASE,
        }, null, 2) }],
      }
    }
    return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: `HTTP ${r.status}: ${r.data}` }) }] }
  }
)

// ---------------------------------------------------------------------------
// 2. deploy
// ---------------------------------------------------------------------------
server.tool(
  "deploy",
  "Deploy BPMN/CMMN/DMN/Form artifacts to the Flowable engine",
  {
    files: z.array(z.object({
      name: z.string(),
      content: z.string(),
    })),
    deployment_name: z.string().optional(),
    blueprint_id: z.string().optional(),
  },
  async ({ files, deployment_name, blueprint_id }) => {
    // Fail-closed gate check (Constitution R2) — same module as the CLI.
    const bpId = blueprintIdFromFiles(blueprint_id, files)
    if (!bpId) {
      return refusal(
        "deploy blocked: no blueprint_id (pass blueprint_id, or include a deploy-manifest.json among files). " +
        "Refusing to deploy an unidentifiable blueprint to a live engine."
      )
    }
    const gate = checkGates(REPO_ROOT, { blueprintId: bpId })
    if (!gate.ok) return refusal(`deploy blocked: ${gate.reason}`)

    const formData = new FormData()
    for (const f of files) {
      const mimeType = f.name.endsWith(".json") ? "application/json" : "text/xml"
      formData.append("file", new Blob([f.content], { type: mimeType }), f.name)
    }
    if (deployment_name) formData.append("name", deployment_name)

    const res = await fetch(`${BASE}/service/repository/deployments`, {
      method: "POST",
      headers: { Authorization: AUTH },
      body: formData,
    })

    if (res.status !== 201) {
      const body = await res.text().catch(() => "")
      return { content: [{ type: "text", text: `Deploy failed: HTTP ${res.status} — ${body.slice(0, 500)}` }] }
    }

    const dep = await res.json()

    // Enrich with process/case/decision/form definitions
    const processDefs = await fetch(`${BASE}/service/repository/process-definitions?deploymentId=${dep.id}`, { headers: { Authorization: AUTH } })
    const caseDefs = await fetch(`${BASE}/service/repository/case-definitions?deploymentId=${dep.id}`, { headers: { Authorization: AUTH } })
    const dmnDefs = await fetch(`${BASE}/service/repository/decision-tables?deploymentId=${dep.id}`, { headers: { Authorization: AUTH } })
    const formDefs = await fetch(`${BASE}/service/repository/form-definitions?deploymentId=${dep.id}`, { headers: { Authorization: AUTH } })

    const result = {
      deployment_id: dep.id,
      process_definitions: (await processDefs.json().catch(() => ({ data: [] }))).data?.map(d => ({ id: d.id, key: d.key, version: d.version })) || [],
      case_definitions: (await caseDefs.json().catch(() => ({ data: [] }))).data?.map(d => ({ id: d.id, key: d.key, version: d.version })) || [],
      decision_tables: (await dmnDefs.json().catch(() => ({ data: [] }))).data?.map(d => ({ id: d.id, key: d.key, version: d.version })) || [],
      form_definitions: (await formDefs.json().catch(() => ({ data: [] }))).data?.map(d => ({ id: d.id, key: d.key })) || [],
    }

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
  }
)

// ---------------------------------------------------------------------------
// 3. validate_bpmn — dry-run deploy then delete
// ---------------------------------------------------------------------------
server.tool(
  "validate_bpmn",
  "Validate BPMN/CMMN/DMN/Form artifacts by dry-run deploying then rolling back",
  {
    files: z.array(z.object({
      name: z.string(),
      content: z.string(),
    })),
  },
  async ({ files }) => {
    const errors = []

    for (const f of files) {
      const formData = new FormData()
      const mimeType = f.name.endsWith(".json") ? "application/json" : "text/xml"
      formData.append("file", new Blob([f.content], { type: mimeType }), f.name)

      const res = await fetch(`${BASE}/service/repository/deployments`, {
        method: "POST",
        headers: { Authorization: AUTH },
        body: formData,
      })

      if (res.status !== 201) {
        const body = await res.text().catch(() => "")
        errors.push({ file: f.name, message: `HTTP ${res.status}: ${body.slice(0, 300)}` })
      } else {
        // Clean up
        const dep = await res.json()
        await fetch(`${BASE}/service/repository/deployments/${dep.id}?cascade=true`, {
          method: "DELETE",
          headers: { Authorization: AUTH },
        })
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          valid: errors.length === 0,
          errors,
        }, null, 2),
      }],
    }
  }
)

// ---------------------------------------------------------------------------
// 4. list_processes
// ---------------------------------------------------------------------------
server.tool(
  "list_processes",
  "List deployed process definitions on the Flowable engine",
  {
    key: z.string().optional(),
    latest: z.boolean().optional(),
  },
  async ({ key, latest }) => {
    let path = "/service/repository/process-definitions"
    const params = []
    if (key) params.push(`key=${encodeURIComponent(key)}`)
    if (latest) params.push("latest=true")
    if (params.length) path += "?" + params.join("&")

    const r = await api("GET", path)
    return { content: [{ type: "text", text: JSON.stringify({ total: r.data?.total || 0, data: r.data?.data || r.data || [] }, null, 2) }] }
  }
)

// ---------------------------------------------------------------------------
// 5. start_process
// ---------------------------------------------------------------------------
server.tool(
  "start_process",
  "Start a new process instance on the Flowable engine",
  {
    process_definition_key: z.string(),
    business_key: z.string().optional(),
    variables: z.record(z.unknown()).optional(),
    blueprint_id: z.string().optional(),
  },
  async ({ process_definition_key, business_key, variables, blueprint_id }) => {
    const guard = checkRuntimeMutation(REPO_ROOT, { blueprintId: blueprint_id })
    if (!guard.ok) return refusal(`start_process blocked: ${guard.reason}`)

    const body = {
      processDefinitionKey: process_definition_key,
      businessKey: business_key,
      variables: variables ? Object.entries(variables).map(([k, v]) => ({ name: k, value: v })) : undefined,
    }

    const r = await api("POST", "/runtime/process-instances", body)
    if (r.status === 201) {
      return { content: [{ type: "text", text: JSON.stringify({ instance_id: r.data.id, definition_id: r.data.processDefinitionId, ended: r.data.ended }) }] }
    }
    return { content: [{ type: "text", text: `Start process failed: HTTP ${r.status} — ${JSON.stringify(r.data)}` }] }
  }
)

// ---------------------------------------------------------------------------
// 6. query_tasks
// ---------------------------------------------------------------------------
server.tool(
  "query_tasks",
  "Query user tasks on the Flowable engine",
  {
    process_instance_id: z.string().optional(),
    assignee: z.string().optional(),
    candidate_group: z.string().optional(),
  },
  async ({ process_instance_id, assignee, candidate_group }) => {
    const params = []
    if (process_instance_id) params.push(`processInstanceId=${encodeURIComponent(process_instance_id)}`)
    if (assignee) params.push(`assignee=${encodeURIComponent(assignee)}`)
    if (candidate_group) params.push(`candidateGroup=${encodeURIComponent(candidate_group)}`)
    const path = "/runtime/tasks" + (params.length ? "?" + params.join("&") : "")

    const r = await api("GET", path)
    return { content: [{ type: "text", text: JSON.stringify({ total: r.data?.total || 0, data: r.data?.data || r.data || [] }, null, 2) }] }
  }
)

// ---------------------------------------------------------------------------
// 7. complete_task
// ---------------------------------------------------------------------------
server.tool(
  "complete_task",
  "Complete a user task on the Flowable engine",
  {
    task_id: z.string(),
    variables: z.record(z.unknown()).optional(),
    blueprint_id: z.string().optional(),
  },
  async ({ task_id, variables, blueprint_id }) => {
    const guard = checkRuntimeMutation(REPO_ROOT, { blueprintId: blueprint_id })
    if (!guard.ok) return refusal(`complete_task blocked: ${guard.reason}`)

    const body = {
      action: "complete",
      variables: variables ? Object.entries(variables).map(([k, v]) => ({ name: k, value: v })) : [],
    }

    const r = await api("POST", `/runtime/tasks/${task_id}`, body)
    if (r.status === 200) {
      return { content: [{ type: "text", text: JSON.stringify({ completed: true, task_id }) }] }
    }
    return { content: [{ type: "text", text: `Complete task failed: HTTP ${r.status} — ${JSON.stringify(r.data)}` }] }
  }
)

// ---------------------------------------------------------------------------
// 8. get_form
// ---------------------------------------------------------------------------
server.tool(
  "get_form",
  "Retrieve form definition by form key or task id",
  {
    form_key: z.string().optional(),
    task_id: z.string().optional(),
  },
  async ({ form_key, task_id }) => {
    if (task_id) {
      const r = await api("GET", `/runtime/tasks/${task_id}/form-data`)
      if (r.status === 200 && r.data) {
        return { content: [{ type: "text", text: JSON.stringify(r.data, null, 2) }] }
      }
    }
    if (form_key) {
      const r = await api("GET", `/form/form-definitions?key=${encodeURIComponent(form_key)}`)
      if (r.status === 200) {
        return { content: [{ type: "text", text: JSON.stringify(r.data?.data || r.data || [], null, 2) }] }
      }
    }
    return { content: [{ type: "text", text: "get_form: provide form_key or task_id" }] }
  }
)

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
const transport = new StdioServerTransport()
await server.connect(transport)
