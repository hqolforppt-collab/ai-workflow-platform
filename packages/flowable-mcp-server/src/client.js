/**
 * client.js — thin Flowable REST client (auth, base URL, error mapping).
 *
 * Extracted from the server so tool logic can be unit-tested against an
 * injected fetch implementation without a running engine.
 */

/** Resolve base URL + credentials from the environment (Constitution C5: names→values at the edge). */
export function resolveFlowableEnv(env = process.env) {
  const base = env.FLOWABLE_URL || "http://localhost:8080/flowable-rest"
  const user = env.FLOWABLE_USER || "rest-admin"
  const pass = env.FLOWABLE_PASS || "test"
  const auth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64")
  return { base, user, pass, auth }
}

/**
 * Build a client bound to a config and a fetch implementation.
 * @param {object} [cfg] — from resolveFlowableEnv()
 * @param {typeof fetch} [fetchImpl] — injectable for tests
 */
export function makeClient(cfg = resolveFlowableEnv(), fetchImpl = fetch) {
  const { base, auth } = cfg

  /** JSON/text request with status + parsed body. */
  async function api(method, path, body) {
    const opts = { method, headers: { Authorization: auth } }
    if (body) {
      opts.headers["content-type"] = "application/json"
      opts.body = JSON.stringify(body)
    }
    const res = await fetchImpl(`${base}${path}`, opts)
    const text = await res.text().catch(() => "")
    try {
      return { status: res.status, data: JSON.parse(text) }
    } catch {
      return { status: res.status, data: text }
    }
  }

  /** Multipart deployment upload. Returns the raw Response. */
  async function deployFiles(files, deploymentName) {
    const formData = new FormData()
    for (const f of files) {
      const mimeType = f.name.endsWith(".json") ? "application/json" : "text/xml"
      formData.append("file", new Blob([f.content], { type: mimeType }), f.name)
    }
    if (deploymentName) formData.append("name", deploymentName)
    return fetchImpl(`${base}/service/repository/deployments`, {
      method: "POST",
      headers: { Authorization: auth },
      body: formData,
    })
  }

  return { base, auth, api, deployFiles }
}
