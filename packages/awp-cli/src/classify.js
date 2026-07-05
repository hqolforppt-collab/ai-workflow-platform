/**
 * classify.js — deterministic domain classification for a user story.
 *
 * Phase 1 (this file, deterministic): normalize the story, match triggers
 * (term + synonyms, light stemming), honour negations ("no email",
 * "passwordless"), then expand via the implication map to a fixpoint and union
 * the ANY-USER-FACING baseline. Every activated domain is tagged
 * explicit | hidden | not-applicable, and negated domains are recorded
 * not-applicable (never silently dropped, never forced back in).
 *
 * Phase 2 (model proposer) lives in the /workflow-builder prompt, not here: it
 * may add candidate domains ONLY from this registry, always tagged
 * `proposed/<model>`. Proposals never satisfy coverage minimums — only the
 * deterministic matches below do.
 *
 * Reading the domain files directly (not a generated index) keeps classify in
 * lock-step with the KB: add a file, it's matchable immediately.
 *
 * Returns:
 *   {
 *     explicit:  [{id, via}],        // matched a trigger keyword
 *     hidden:    [{id, via}],        // pulled in by implication/baseline
 *     notApplicable: [{id, reason}], // user-negated
 *     matchedZero: boolean,          // no functional domain matched
 *     trace: {keyword -> [domainId]} // which keyword fired which domain
 *   }
 */
import { join } from "node:path"
import { listFiles, tryReadYaml } from "./lib/repo.js"

const KB_DIR = ".memory/domain-knowledge"
const BASELINE_TOKEN = "ANY-USER-FACING"

// Negation patterns → the term being negated is captured in group 1.
const NEGATIONS = [
  /\bno\s+([a-z][a-z-]+)/g,
  /\bwithout\s+([a-z][a-z-]+)/g,
  /\bnot?\s+use\s+([a-z][a-z-]+)/g,
]
// Standalone negated adjectives, e.g. "passwordless" → password.
const NEGATED_SUFFIX = /\b([a-z]+)less\b/g

/** Light normalization: lowercase, strip punctuation to spaces, collapse. */
export function normalize(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()
}

/** Very small stemmer: fold common inflections so "registering" ≈ "register". */
export function stem(word) {
  return word
    .replace(/ies$/, "y")
    .replace(/(ing|ed|es|s)$/, "")
    .replace(/-$/, "")
}

/** Build a set of normalized+stemmed tokens (unigrams and bigrams) for a story. */
function tokenSet(storyNorm) {
  const words = storyNorm.split(" ").filter(Boolean)
  const set = new Set()
  for (let i = 0; i < words.length; i++) {
    set.add(words[i])
    set.add(stem(words[i]))
    if (i + 1 < words.length) {
      set.add(`${words[i]} ${words[i + 1]}`)
      set.add(`${stem(words[i])} ${stem(words[i + 1])}`)
    }
  }
  return set
}

/** Does a (possibly multi-word) trigger term appear in the story? */
function termMatches(term, storyNorm, tokens) {
  const t = normalize(term)
  if (!t) return false
  if (t.includes(" ")) return storyNorm.includes(t) // multi-word: substring
  return tokens.has(t) || tokens.has(stem(t))
}

/** Load every domain file into a map id -> doc. */
export function loadDomains(root) {
  const domains = new Map()
  const files = listFiles(join(root, KB_DIR), (f) => f.endsWith(".yaml"))
  for (const abs of files) {
    const base = abs.replace(/\\/g, "/").split("/").pop()
    if (["index.yaml", "index.head.yaml", "TEMPLATE.yaml", "registry.yaml"].includes(base)) continue
    const doc = tryReadYaml(abs)
    if (doc && doc.id) domains.set(doc.id, doc)
  }
  return domains
}

export function classifyStory(root, story, opts = {}) {
  const domains = opts.domains || loadDomains(root)
  const storyNorm = normalize(story)
  const tokens = tokenSet(storyNorm)

  // --- negations -----------------------------------------------------------
  const negatedTerms = new Set()
  for (const re of NEGATIONS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(storyNorm))) negatedTerms.add(stem(m[1]))
  }
  let sm
  NEGATED_SUFFIX.lastIndex = 0
  while ((sm = NEGATED_SUFFIX.exec(storyNorm))) negatedTerms.add(stem(sm[1]))

  // A domain is negated if any of its trigger terms is a negated term.
  const isNegated = (doc) => {
    for (const t of doc.triggers || []) {
      const terms = typeof t === "string" ? [t] : [t.term, ...(t.synonyms || [])]
      for (const term of terms) {
        if (negatedTerms.has(stem(normalize(term)))) return true
      }
    }
    return false
  }

  // --- phase 1: explicit trigger matches -----------------------------------
  const explicit = new Map() // id -> via keyword
  const notApplicable = new Map() // id -> reason
  const trace = {}

  for (const [id, doc] of domains) {
    if (isNegated(doc)) {
      notApplicable.set(id, "user-negated")
      continue
    }
    for (const t of doc.triggers || []) {
      if (t === BASELINE_TOKEN) continue
      const terms = typeof t === "string" ? [t] : [t.term, ...(t.synonyms || [])]
      const hit = terms.find((term) => term !== BASELINE_TOKEN && termMatches(term, storyNorm, tokens))
      if (hit) {
        explicit.set(id, hit)
        ;(trace[hit] = trace[hit] || []).push(id)
        break
      }
    }
  }

  const matchedZero = explicit.size === 0

  // --- phase 1b: implication fixpoint + baseline ---------------------------
  const active = new Set(explicit.keys())
  const hidden = new Map() // id -> via

  const addHidden = (id, via) => {
    if (notApplicable.has(id)) return // negation wins
    if (!active.has(id)) {
      active.add(id)
      hidden.set(id, via)
    }
  }

  // Baseline cross-cutting domains (those triggered by ANY-USER-FACING) apply to
  // ANY feature handed to /workflow-builder — including a zero-match story,
  // which still gets the baseline but is separately flagged (matchedZero) so the
  // gap is visible rather than silently producing a generic blueprint.
  if (opts.baseline !== false) {
    for (const [id, doc] of domains) {
      const isBaseline = (doc.triggers || []).some((t) => t === BASELINE_TOKEN || (t && t.term === BASELINE_TOKEN))
      if (isBaseline) addHidden(id, "baseline")
    }
  }

  // Implication fixpoint.
  let changed = true
  while (changed) {
    changed = false
    for (const id of [...active]) {
      const doc = domains.get(id)
      if (!doc) continue
      for (const target of doc.implies || []) {
        if (!active.has(target) && !notApplicable.has(target)) {
          addHidden(target, `implied-by:${id}`)
          changed = true
        }
      }
    }
  }

  return {
    explicit: [...explicit.entries()].map(([id, via]) => ({ id, via })).sort(byId),
    hidden: [...hidden.entries()].map(([id, via]) => ({ id, via })).sort(byId),
    notApplicable: [...notApplicable.entries()].map(([id, reason]) => ({ id, reason })).sort(byId),
    matchedZero,
    trace,
    count: active.size,
  }
}

function byId(a, b) {
  return a.id.localeCompare(b.id)
}
