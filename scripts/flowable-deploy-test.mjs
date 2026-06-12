#!/usr/bin/env node
/**
 * Flowable engine deployment proof (Gap 4, GAP-FULFILLMENT-ROADMAP).
 *
 * Deploys every *.bpmn20.xml model to a live Flowable REST engine and asserts
 * the engine accepts it and registers an executable process definition.
 * This is the strongest validity proof available: the actual target engine
 * parses, validates, and compiles the model.
 *
 * Requires a running Flowable REST instance (CI uses the
 * flowable/flowable-rest Docker image as a service container).
 *
 * Env:
 *   FLOWABLE_URL   base URL  (default http://localhost:8080/flowable-rest)
 *   FLOWABLE_USER  username  (default rest-admin)
 *   FLOWABLE_PASS  password  (default test)
 *
 * Usage: node scripts/flowable-deploy-test.mjs
 * Exits non-zero on any failure. Run by .github/workflows/bpmn-roundtrip.yml.
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, dirname, basename } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const BASE = process.env.FLOWABLE_URL ?? "http://localhost:8080/flowable-rest"
const AUTH = "Basic " + Buffer.from(`${process.env.FLOWABLE_USER ?? "rest-admin"}:${process.env.FLOWABLE_PASS ?? "test"}`).toString("base64")

let failures = 0
const fail = (msg) => {
  failures++
  console.error(`  FAIL  ${msg}`)
}
const pass = (msg) => console.log(`  PASS  ${msg}`)

function findFiles(dir, predicate, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".git")) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) findFiles(full, predicate, out)
    else if (predicate(full)) out.push(full)
  }
  return out
}

async function waitForEngine(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/service/repository/deployments?size=1`, { headers: { Authorization: AUTH } })
      if (res.ok) return true
    } catch {
      // engine not up yet
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
  return false
}

async function deploy(xmlPath) {
  const name = basename(xmlPath)
  const form = new FormData()
  form.append("file", new Blob([readFileSync(xmlPath)], { type: "text/xml" }), name)

  const res = await fetch(`${BASE}/service/repository/deployments`, {
    method: "POST",
    headers: { Authorization: AUTH },
    body: form,
  })

  if (res.status !== 201) {
    const body = await res.text().catch(() => "")
    fail(`${name}: Flowable rejected deployment (HTTP ${res.status}) ${body.slice(0, 500)}`)
    return
  }

  const deployment = await res.json()
  pass(`${name}: deployed to Flowable (deployment id ${deployment.id})`)

  // Assert the engine actually registered an executable process definition.
  const defsRes = await fetch(`${BASE}/service/repository/process-definitions?deploymentId=${deployment.id}`, {
    headers: { Authorization: AUTH },
  })
  const defs = await defsRes.json()
  if (!defsRes.ok || !defs.data?.length) {
    fail(`${name}: deployment created but no process definition registered — model is not executable`)
    return
  }
  for (const def of defs.data) {
    pass(`${name}: engine registered executable process definition "${def.key}" (v${def.version})`)
  }
}

const xmlFiles = findFiles(root, (f) => f.endsWith(".bpmn20.xml"))
if (!xmlFiles.length) {
  console.error("FAIL  no *.bpmn20.xml files found — nothing to deploy")
  process.exit(1)
}

console.log(`flowable-deploy: waiting for engine at ${BASE} ...`)
if (!(await waitForEngine())) {
  console.error("FAIL  Flowable engine did not become ready in time")
  process.exit(1)
}
console.log(`flowable-deploy: engine ready, deploying ${xmlFiles.length} model(s)\n`)

for (const xmlPath of xmlFiles) {
  await deploy(xmlPath)
}

console.log(`\nflowable-deploy: ${failures === 0 ? "PASS" : `FAIL (${failures} failure(s))`}`)
process.exit(failures === 0 ? 0 : 1)
