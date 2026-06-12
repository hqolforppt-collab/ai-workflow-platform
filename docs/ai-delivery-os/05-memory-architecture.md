# 5. Memory Architecture

## Seven-Tier Memory Model

| Tier | Path | Scope | Lifetime | Examples |
|------|------|-------|----------|----------|
| **Strategic** | `memory/strategic/` | Enterprise | Permanent | Tech radar, enterprise constraints, vendor decisions |
| **Domain** | `memory/domain/<domain>/` | Business domain | Long-term | Lending rules, KYC norms, domain glossaries |
| **Project** | `memory/project/<project-id>/` | One project | Project life + archive | Scope decisions, stakeholder context |
| **Session** | `memory/session/<run-id>/` | One execution | Ephemeral (run only) | Working notes, intermediate drafts |
| **Decision** | `memory/decisions/` | Cross-project | Permanent | ADRs with outcomes; superseded chains |
| **Pattern** | `memory/patterns/` | Cross-project | Permanent (curated) | Proven model structures, integration patterns |
| **Failure** | `memory/failures/` | Cross-project | Permanent (curated) | Anti-patterns, root-caused incidents, rejected designs |

## Memory Record Format

Every memory entry is a Markdown file with YAML front matter:

```yaml
---
id: mem-pattern-0042
tier: pattern
title: Retry-with-escalation boundary event pattern
domains: [payments, integrations]
tags: [bpmn, error-handling, flowable]
confidence: high          # high | medium | low
sourceRuns: [acme-loans/run-7]
created: 2026-06-12
lastValidated: 2026-06-12
supersedes: mem-pattern-0017
status: active            # active | stale | pruned
---
(body: the actual knowledge)
```

## Memory Lifecycle

```
capture (session) → triage (run end) → promote (curated tier) → validate (periodic) → prune/archive
```

1. **Capture** — agents write freely to `session/` during a run.
2. **Triage** — at run completion, the Governance Agent runs the *learning harvest*: session entries are classified as promote / discard.
3. **Promote** — promotion to domain/pattern/failure/decision tiers requires human curation approval (these tiers steer future projects).
4. **Validate** — entries carry `lastValidated`; entries untouched for N OS releases are flagged `stale`.
5. **Prune** — stale entries are archived (never hard-deleted; auditability) and removed from retrieval indexes.

## Indexing

`memory/index.yaml` is the master index. Each entry records: id, tier, tags, domains, embedding-source hash, status. Retrieval tooling (RAG or grep-based) operates only on indexed, `active` entries.

## Retention Rules

| Tier | Retention | Pruning Policy |
|------|-----------|----------------|
| Session | Until run ends | Auto-deleted after harvest |
| Project | Archive at project close | Compressed to project summary + key decisions |
| Strategic/Decision/Pattern/Failure | Permanent | Stale-flag → archive, never delete |
| Domain | Permanent per domain | Reviewed at domain refresh cycles |

## Retrieval Strategy

When an agent starts a task, memory is retrieved in priority order (see deliverable 10):

1. **Failure memory** matching the task domain/tags — *checked first* (avoid known mistakes).
2. **Pattern memory** matching task type.
3. **Decision memory** for binding prior decisions.
4. **Domain memory** for the active business domain.
5. **Project memory** for the current project.
6. **Strategic memory** constraints (always loaded, compressed form).

Retrieved entries enter the agent's context as a ranked, compressed packet — never raw-dumped.
