import { test } from "node:test"
import assert from "node:assert/strict"
import { makeClient, resolveFlowableEnv } from "../src/client.js"

test("resolveFlowableEnv falls back to sane defaults", () => {
  const cfg = resolveFlowableEnv({})
  assert.equal(cfg.base, "http://localhost:8080/flowable-rest")
  assert.ok(cfg.auth.startsWith("Basic "))
})

test("resolveFlowableEnv reads names from the provided env", () => {
  const cfg = resolveFlowableEnv({ FLOWABLE_URL: "http://engine:9000", FLOWABLE_USER: "u", FLOWABLE_PASS: "p" })
  assert.equal(cfg.base, "http://engine:9000")
})

test("api() calls the injected fetch and parses JSON", async () => {
  const calls = []
  const fakeFetch = async (url, opts) => {
    calls.push({ url, method: opts.method })
    return { status: 200, text: async () => JSON.stringify({ version: "7.0.0" }) }
  }
  const client = makeClient({ base: "http://x", auth: "Basic z" }, fakeFetch)
  const r = await client.api("GET", "/service/management/engine")
  assert.equal(r.status, 200)
  assert.equal(r.data.version, "7.0.0")
  assert.equal(calls[0].url, "http://x/service/management/engine")
  assert.equal(calls[0].method, "GET")
})

test("api() surfaces non-JSON bodies as text", async () => {
  const fakeFetch = async () => ({ status: 500, text: async () => "boom" })
  const client = makeClient({ base: "http://x", auth: "Basic z" }, fakeFetch)
  const r = await client.api("GET", "/oops")
  assert.equal(r.status, 500)
  assert.equal(r.data, "boom")
})
