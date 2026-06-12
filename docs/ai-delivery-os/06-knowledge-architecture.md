# 6. Knowledge Architecture

## Distinction from Memory

- **Memory** = what the organization *learned* (experiential, run-derived).
- **Knowledge** = what the organization *references* (curated, authoritative sources).

## Knowledge Corpus

| Collection | Path | Content |
|------------|------|---------|
| Documentation | `knowledge/documentation/` | Product docs, platform manuals |
| Architecture Assets | `knowledge/architecture-assets/` | Reference architectures, diagrams-as-code |
| Flowable Assets | `knowledge/flowable-assets/` | Engine field references, BPMN/CMMN/DMN element catalogs, API docs |
| BMAD Assets | `knowledge/bmad-assets/` | BMAD method packs, persona definitions |
| Best Practices | `knowledge/best-practices/` | OWASP, NIST, modeling guidelines |
| Standards | `knowledge/standards/` | Mirrors of governance standards in RAG-ready form |
| Playbooks | `knowledge/playbooks/` | Step-by-step procedures (e.g., "stand up a new domain") |

## RAG Pipeline Design

```
source → normalize → chunk → enrich (metadata) → embed → index → retrieve → cite
```

### Chunking Policy

| Content Type | Strategy | Size |
|--------------|----------|------|
| Reference docs (field catalogs) | Per-element/per-field chunks | ~200–400 tokens |
| Playbooks | Per-step chunks with step context header | ~300–500 tokens |
| Standards/policies | Per-rule chunks (one rule = one chunk) | ~150–300 tokens |
| Architecture docs | Per-section, heading-anchored | ~400–600 tokens |

Every chunk carries a **stable anchor** (file + heading slug) so citations resolve back to source.

### Metadata Schema (per chunk)

```yaml
chunk:
  sourcePath: knowledge/flowable-assets/bpmn-field-reference.md
  anchor: user-task-fields
  collection: flowable-assets
  version: 3.2.0           # source document version
  domains: [workflow]
  tags: [bpmn, userTask, formKey]
  authority: normative      # normative | informative
  freshness: 2026-06-01
```

`authority: normative` chunks (standards, governance mirrors) outrank `informative` ones at retrieval time.

## Versioning

- Every knowledge document carries a SemVer version in front matter.
- The RAG index manifest (`knowledge/index.yaml`) records which document versions are indexed.
- Project manifests pin the knowledge index version used — answers are reproducible per run.
- Superseded documents stay retrievable for pinned projects but are excluded from new-project indexes.

## Knowledge Quality Gates

A document enters the corpus only if:

1. **Sourced** — provenance recorded (origin, author, date).
2. **Versioned** — front matter complete.
3. **Chunk-clean** — passes chunk-lint (no orphan fragments, anchors resolve).
4. **Non-duplicative** — similarity check against existing corpus (<80% overlap).
5. **Reviewed** — human curator approval for `normative` content.

Quarterly **freshness review**: documents past their review-by date are flagged; agents receive a staleness warning when citing them.

## Retrieval Contract for Agents

- Agents must **cite** knowledge chunks (anchor refs) in produced artifacts — uncited normative claims fail the Governance Agent's audit.
- Normative chunks are binding; conflicts between retrieved chunks escalate: constitution > governance standards > best practices > documentation.
