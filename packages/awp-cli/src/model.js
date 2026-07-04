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
import { tryReadYaml } from "./lib/repo.js"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export function loadModelConfig(root) {
  const cfgPath = join(root, ".awp", "config.yaml")
  const cfg = tryReadYaml(cfgPath) || {}
  const model = cfg.model || {}
  const flowable = cfg.flowable || {}
  const defaults = cfg.defaults || {}

  return {
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
  const { systemPrompt, userPrompt, config, tier } = opts
  const apiKey = process.env[config.apiKeyEnv]
  if (!apiKey) {
    yield { stage: 0, name: "setup", status: "error", summary: "", content: null, error: `env var ${config.apiKeyEnv} not set` }
    return
  }

  const provider = config.provider
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
    const res = await fetch(url, { method: "POST", headers, body })
    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      yield { stage: 0, name: "setup", status: "error", summary: "", content: null, error: `HTTP ${res.status}: ${errText.slice(0, 500)}` }
      return
    }
    const data = await res.json()

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
