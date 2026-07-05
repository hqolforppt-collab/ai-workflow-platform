/**
 * classify.js (command) — `awp classify "<story>"`.
 *
 * Surfaces Stage-2 domain discovery standalone so it's auditable: which
 * keyword fired which domain, what the baseline + implication fixpoint pulled
 * in, and what the story negated. --json for machine consumption.
 */
import { requireRepoRoot } from "../lib/repo.js"
import { classifyStory } from "../classify.js"

export async function classifyCmd(flags) {
  const root = requireRepoRoot()
  const story = (flags._ || []).join(" ").trim()
  if (!story) {
    console.error('awp classify: no story given. Usage: awp classify "Create login and registration"')
    return 1
  }

  const result = classifyStory(root, story)

  if (flags.json) {
    console.log(JSON.stringify(result, null, 2))
    return 0
  }

  console.log(`Story:  "${story}"`)
  console.log(`Domains: ${result.count} activated (${result.explicit.length} explicit, ${result.hidden.length} hidden, ${result.notApplicable.length} not-applicable)`)
  if (result.matchedZero) {
    console.log(`\n⚠ baseline-only — no functional pack matched this story.`)
    console.log(`  Consider authoring a domain for it (see .memory/domain-knowledge/AUTHORING.md).`)
  }
  if (result.explicit.length) {
    console.log(`\nExplicit (keyword-matched):`)
    for (const d of result.explicit) console.log(`  ${d.id.padEnd(24)} ← "${d.via}"`)
  }
  if (result.hidden.length) {
    console.log(`\nHidden (implied / baseline):`)
    for (const d of result.hidden) console.log(`  ${d.id.padEnd(24)} ← ${d.via}`)
  }
  if (result.notApplicable.length) {
    console.log(`\nNot-applicable (negated):`)
    for (const d of result.notApplicable) console.log(`  ${d.id.padEnd(24)} (${d.reason})`)
  }
  return 0
}
