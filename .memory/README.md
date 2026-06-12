# Memory System (7-Tier)

Authority: [.ai/constitution.md](../.ai/constitution.md). Source design: `docs/ai-delivery-os/05-memory-architecture.md`.

## Tiers

| Tier | Purpose | Who writes |
|------|---------|-----------|
| `strategic/` | OSS governance principles, mission-level decisions | Humans / governance board |
| `domain/` | Flowable, BPMN, CMMN, DMN knowledge | Humans; agents propose |
| `pattern/` | Reusable solution patterns | Humans; agents propose |
| `decision/` | ADRs and approved architecture decisions | Architect agent (approved), humans |
| `project/` | Per-project context and gate records | Agents during runs |
| `session/` | Scratch space for active sessions | All agents (only unrestricted area) |
| `failure/` | Post-mortems and lessons learned | QA agent, humans |

## Access Rules

1. Agents may only write to tiers declared in their `memory-access.write` (see `.agents/registry.yaml`).
2. `session/` is the only unrestricted agent write area (Constitution C4).
3. Failure memory is consulted **before** pattern memory (Constitution R7).
4. All entries are registered in `index.yaml` via `.tools/memory-sync.sh`.

## Entry Format

Every memory file carries frontmatter: `id`, `tier`, `created`, `source` (trace), `status`.
