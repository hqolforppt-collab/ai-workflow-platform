# Authoring a domain

A domain is the unit of best-practice knowledge in this platform. Each is one
small YAML file that teaches `/workflow-builder` what an expert would silently
add for a given concern. Adding one is a **content** change — no code.

## Steps

1. **Copy `TEMPLATE.yaml`** to `.memory/domain-knowledge/<pack>/<id>.yaml`.
   The `id` must equal the filename stem and be unique across the whole KB.
2. **Pick `type`.** `functional` = a capability the user asks for (payments,
   login, ordering). `cross-cutting` = a concern implied by any feature
   (security, audit, retention).
3. **Write `triggers`.** The words a user would actually type. Add `synonyms`
   generously — matching is deterministic, so a missed synonym is a missed
   activation. Cross-cutting baseline domains use the single trigger
   `ANY-USER-FACING` instead of keywords.
4. **Declare `implies`.** Other domains this one always brings. Every target
   must exist as a file, or `awp validate --kb` fails (KB-I1). Keep the graph
   honest: `payments` implies `fraud-detection`, not the reverse.
5. **Cite `standards` with provenance.** `{id, version, verified, url}`. A bare
   string still parses but warns — provenance is what makes staleness
   detectable.
6. **Write 2-6 `constraints`.** This is the heart of the file. Each must be
   **concrete and actionable**: a number, a duration, a limit, an algorithm.
   "Handle errors gracefully" is worthless; "Retries use exponential backoff,
   max 5 attempts, jittered, idempotency-key required" is a constraint. IDs are
   `<DOM>-C<n>` where DOM is 2-5 uppercase letters (`PAY`, `APRV`, `ESIGN`).
7. **Add `requirement-seeds`** (optional but recommended). Each seeds a
   requirement into the blueprint with a real Given/When/Then acceptance
   criterion — measurable, not aspirational.
8. **Set `review`.** Cadence + last-reviewed + owner. Security/compliance
   domains: `P6M`. Stable patterns: `P12M`–`P24M`.

## Rules the validator enforces (`awp validate --kb`)

| Code | Rule |
|------|------|
| KB-FIELD | required fields present, IDs well-formed, constraints non-trivial |
| KB-I1 | every `implies` target resolves to a real domain |
| KB-I2 | every trigger-map domain resolves (no orphan triggers) |
| KB-I3 | no keyword spans > 2 packs without a `disambiguation` entry |
| KB-I4 | domain ids unique across all packs |
| KB-I5 | registry ⇄ files agree |
| KB-PROV | standards carry provenance (warn) |
| KB-STALE | `review` not overdue (warn) |

## After adding domains

Run `awp kb build-index` to regenerate `index.yaml`, then `awp validate --kb`.
CI runs `awp kb build-index --check` to catch a stale index and
`awp validate --kb` to catch a broken graph. Add a coverage golden test
(`GT-pack-<name>`) proving a representative story activates the pack.

## Quality bar

Before merging a pack, run `awp review` (advisory) over a blueprint that uses
it — the rubric flags vague constraints and low specificity. Prefer fewer,
sharper domains over many thin ones.
