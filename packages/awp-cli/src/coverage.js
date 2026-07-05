/**
 * coverage.js — deterministic constraint-coverage metric.
 *
 * Answers "did the blueprint actually USE the best practices its activated
 * domains carry?" — not just "did it name the domains" (VAL-012 covers that).
 *
 * For every domain the story activates (via classify), we count how many of its
 * constraint ids (PAY-C1, APRV-C2, …) and requirement-seed ids
 * (discovery/<domain>/REQ-n) are cited anywhere in the blueprint text
 * (source/trace/notes/description fields all count — we scan the raw text).
 *
 * Pure code, no model. Returns a structured metric the coverage report and
 * `awp review` both surface.
 */
import { classifyStory } from "./classify.js"
import { loadDomains } from "./classify.js"

/**
 * @param {string} root
 * @param {string} story
 * @param {string} blueprintText concatenated raw YAML of the blueprint
 * @returns {{
 *   domainsTotal:number, domainsWithCitation:number,
 *   constraintsTotal:number, constraintsCited:number,
 *   perDomain: {id:string, cited:number, total:number}[]
 * }}
 */
export function computeCoverage(root, story, blueprintText, opts = {}) {
  const domains = opts.domains || loadDomains(root)
  const cls = classifyStory(root, story, { domains })
  const active = [...cls.explicit, ...cls.hidden].map((d) => d.id)

  const text = String(blueprintText || "")
  let constraintsTotal = 0
  let constraintsCited = 0
  let domainsWithCitation = 0
  let domainsReflected = 0
  const perDomain = []

  for (const id of active) {
    const doc = domains.get(id)
    if (!doc) continue

    // Domain reflection: the blueprint names this domain (by id or a
    // `discovery/<id>` source citation) — "did it USE this domain at all".
    const reflected = text.includes(`discovery/${id}`) || new RegExp(`\\b${id}\\b`).test(text)
    if (reflected) domainsReflected++

    // Constraint citation: the stricter "did it cite this domain's specific
    // best-practice rules" — exact constraint/seed ids.
    const ids = []
    for (const c of doc.constraints || []) if (c && c.id) ids.push(c.id)
    for (const s of doc["requirement-seeds"] || []) if (s && s.id) ids.push(s.id)

    let cited = 0
    for (const cid of ids) if (text.includes(cid)) cited++
    constraintsTotal += ids.length
    constraintsCited += cited
    if (cited > 0) domainsWithCitation++
    perDomain.push({ id, reflected, cited, total: ids.length })
  }

  return {
    domainsTotal: perDomain.length,
    domainsReflected,
    domainsWithCitation,
    constraintsTotal,
    constraintsCited,
    perDomain: perDomain.sort((a, b) => a.id.localeCompare(b.id)),
  }
}

/** One-line summary for the /workflow-builder coverage report. */
export function coverageLine(cov) {
  const dpct = cov.domainsTotal ? Math.round((cov.domainsReflected / cov.domainsTotal) * 100) : 0
  const cpct = cov.constraintsTotal ? Math.round((cov.constraintsCited / cov.constraintsTotal) * 100) : 0
  return `Domain reflection: ${cov.domainsReflected}/${cov.domainsTotal} (${dpct}%)  |  ` +
    `Constraint citation: ${cov.constraintsCited}/${cov.constraintsTotal} (${cpct}%)`
}
