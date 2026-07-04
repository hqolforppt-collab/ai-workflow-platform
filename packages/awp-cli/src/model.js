/**
 * model.js — LLM provider abstraction for awp-cli.
 *
 * Supports: anthropic, openai, ollama.
 * Config driven by .awp/config.yaml (env-var names only, per Constitution C5).
 * Returns an async iterator that yields {stage, name, status, summary} events
 * so build.js can emit [STAGE n/6] progress markers.
 *
 * Node 18+ — uses global fetch().
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { tryReadYaml } from "./lib/repo.js"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Resolved config shape. A malformed .awp/config.yaml produces a clear warning
// rather than a downstream crash (the defaults still apply).
const ConfigSchema = z.object({
  provider: z.enum(["anthropic", "openai", "ollama", "mock"]),
  modelId: z.string().min(1),
  apiKeyEnv: z.string().min(1),
  baseUrl: z.string().nullable(),
  tierOverride: z.string().nullable(),
  maturityLevel: z.string().regex(/^L[1-6]$/),
  staged: z.boolean(),
  outputDir: z.string().min(1),
  flowableUrlEnv: z.string(),
  flowableUserEnv: z.string(),
  flowablePassEnv: z.string(),
})

export function loadModelConfig(root) {
  const cfgPath = join(root, ".awp", "config.yaml")
  const cfg = tryReadYaml(cfgPath) || {}
  const model = cfg.model || {}
  const flowable = cfg.flowable || {}
  const defaults = cfg.defaults || {}

  const resolved = {
    provider: model.provider || "anthropic",
    modelId: model.id || "claude-sonnet-5",
    apiKeyEnv: model.api_key_env || "ANTHROPIC_API_KEY",
    baseUrl: model.base_url || null,
    tierOverride: cfg.tier_override || null,
    maturityLevel: defaults.maturity_level || "L6",
    staged: defaults.staged !== false,
    outputDir: defaults.output_dir || "blueprints",
    flowableUrlEnv: flowable.url_env || "FLOWABLE_URL",
    flowableUserEnv: flowable.user_env || "FLOWABLE_USER",
    flowablePassEnv: flowable.pass_env || "FLOWABLE_PASS",
  }

  const parsed = ConfigSchema.safeParse(resolved)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    console.warn(`[WARN] .awp/config.yaml has invalid values (${issues}); using them as-is.`)
  }

  return resolved
}

// ---------------------------------------------------------------------------
// Tier detection
// ---------------------------------------------------------------------------

export function detectTier(modelId, tiersYaml, tierOverride) {
  if (tierOverride) return tierOverride
  const tiers = tiersYaml?.tiers || []
  for (const t of tiers) {
    const patterns = t.match || []
    for (const pat of patterns) {
      if (matchGlob(modelId, pat)) return t.id
    }
  }
  return tiersYaml?.default_tier || "medium"
}

function matchGlob(text, pattern) {
  const re = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
  return new RegExp("^" + re + "$", "i").test(text)
}

// ---------------------------------------------------------------------------
// Streaming model call
// ---------------------------------------------------------------------------

/**
 * Send a prompt to the configured model and yield structured stage events.
 *
 * @param {object} opts
 * @param {string} opts.systemPrompt — system-level instruction
 * @param {string} opts.userPrompt   — the assembled prompt for this stage
 * @param {object} opts.config        — from loadModelConfig()
 * @param {string} opts.tier          — detected tier id
 * @returns {AsyncIterable<{stage:number, name:string, status:string, summary:string, content:string|null, error:string|null}>}
 */
export async function* streamModelCall(opts) {
  const { systemPrompt, userPrompt, config, tier, stageFile } = opts
  const provider = config.provider

  // Mock provider — deterministic, no API key. Returns canned per-stage YAML
  // from AWP_MOCK_DIR/<stageFile> when present, else a minimal valid stub.
  // This is what lets CI run `build --execute --staged --resume-from` E2E
  // with no secrets.
  if (provider === "mock") {
    let content = `# mock output${stageFile ? ` for ${stageFile}` : ""}\n`
    const mockDir = process.env.AWP_MOCK_DIR
    if (mockDir && stageFile) {
      try {
        content = readFileSync(join(mockDir, stageFile), "utf8")
      } catch {
        /* fall back to stub */
      }
    }
    yield { stage: 0, name: "mock", status: "done", summary: "mock responded", content, error: null }
    return
  }

  const apiKey = process.env[config.apiKeyEnv]
  if (!apiKey) {
    yield { stage: 0, name: "setup", status: "error", summary: "", content: null, error: `env var ${config.apiKeyEnv} not set` }
    return
  }

  let url, headers, body

  if (provider === "anthropic") {
    url = config.baseUrl || "https://api.anthropic.com/v1/messages"
    headers = {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    }
    body = JSON.stringify({
      model: config.modelId,
      max_tokens: tier === "small" ? 4096 : tier === "medium" ? 8192 : 16384,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    })
  } else if (provider === "openai") {
    url = config.baseUrl || "https://api.openai.com/v1/chat/completions"
    headers = {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    }
    body = JSON.stringify({
      model: config.modelId,
      max_tokens: tier === "small" ? 4096 : tier === "medium" ? 8192 : 16384,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    })
  } else if (provider === "ollama") {
    url = config.baseUrl || "http://localhost:11434/api/generate"
    headers = { "content-type": "application/json" }
    body = JSON.stringify({
      model: config.modelId,
      prompt: systemPrompt + "\n\n" + userPrompt,
      stream: false,
    })
  } else {
    yield { stage: 0, name: "setup", status: "error", summary: "", content: null, error: `unknown provider: ${provider}` }
    return
  }

  try {
    const data = await fetchWithRetry(url, { method: "POST", headers, body })

    let content
    if (provider === "anthropic") {
      content = data.content?.[0]?.text || ""
    } else if (provider === "openai") {
      content = data.choices?.[0]?.message?.content || ""
    } else if (provider === "ollama") {
      content = data.response || ""
    }

    yield { stage: 0, name: "setup", status: "done", summary: "model responded", content, error: null }
  } catch (err) {
    yield { stage: 0, name: "setup", status: "error", summary: "", content: null, error: err.message }
  }
}

/**
 * POST with bounded exponential backoff. Retries transient failures only
 * (429 + 5xx + network errors); 4xx (other than 429) fail fast. Resolves the
 * parsed JSON body or throws a descriptive Error after the final attempt.
 */
async function fetchWithRetry(url, init, { attempts = 3, baseDelayMs = 500 } = {}) {
  let lastErr
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, init)
      if (res.ok) return await res.json()

      const errText = await res.text().catch(() => "")
      const retriable = res.status === 429 || res.status >= 500
      lastErr = new Error(`HTTP ${res.status}: ${errText.slice(0, 500)}`)
      if (!retriable || attempt === attempts) throw lastErr
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err))
      if (attempt === attempts) throw lastErr
    }
    await sleep(baseDelayMs * 2 ** (attempt - 1))
  }
  throw lastErr
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
