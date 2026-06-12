# 10. Context Management Architecture

## Problem

AI context windows are finite and platform-dependent. The OS must guarantee that every agent, on every platform, receives the *right* context — compressed, prioritized, and reproducible — at every handoff.

## Context Packet — the Unit of Context

All context flows as a **context packet**, a structured YAML envelope:

```yaml
contextPacket:
  id: ctx-run7-0042
  producedBy: business-analyst-agent
  consumedBy: architect-agent
  task: produce architecture spec for approved FR set
  budget: 12000              # token budget granted to this packet
  sections:
    - kind: binding          # MUST be honored
      content: [constitution digest, governance rules digest, sealed G3 artifacts]
    - kind: working          # task inputs
      content: [FR set, domain model, NFR set]
    - kind: advisory         # ranked memory/knowledge retrievals
      content: [pattern mem hits, failure mem hits, knowledge citations]
  excluded:                  # explicitly dropped, with reason (auditable)
    - { item: raw discovery transcripts, reason: superseded by domain model }
  expansionHooks:            # how to pull more if needed
    - { ref: specifications/functional-requirements/, method: read-on-demand }
```

## Context Prioritization (ranking rules)

`context/prioritization.yaml` defines a strict ordering when budget is constrained:

1. Constitution + governance digests (always present, max-compressed)
2. Sealed gate artifacts the task depends on
3. Direct task inputs (current artifacts)
4. **Failure memory** matching task tags
5. Pattern/decision memory matches
6. Knowledge citations (normative before informative)
7. Project background, prior session summaries

Items below the budget cut-line move to `expansionHooks` rather than disappearing.

## Context Compression

| Technique | Applied To | Rule |
|-----------|-----------|------|
| Digesting | Constitution, policies | Maintained pre-built digests (`*.digest.md`), regenerated on change |
| Summarization | Closed stages | Stage-exit summaries written by owner agent, validated at gate |
| Schema-stripping | YAML artifacts | Send instance data, reference (not inline) the schema |
| Deduplication | Memory hits | Superseded entries excluded by index status |

Compression is **lossy-with-receipts**: every compression records what was dropped and how to recover it (expansion hooks).

## Context Expansion

Agents may pull additional context on demand via expansion hooks (read specific files, query memory index). Expansion is logged in the session memory so the consumed context of any decision is reconstructible.

## Context Windows Strategy

- Each agent declares a `contextProfile` (in `agent.yaml`) mapping to a budget template per platform adapter.
- Adapters translate budgets to platform realities (e.g., Claude Code subagent context vs Cursor rules file size).
- Long stages checkpoint: the owner agent emits an intermediate summary every N artifacts so a fresh session can resume losslessly.

## Context Handoffs

| Handoff | Mechanism |
|---------|-----------|
| Agent → Agent | Context packet attached to artifact handoff (deliverable 3); receiver validates `binding` section hashes |
| Skill invocation | Agent passes only the skill's declared inputs + relevant advisory hits |
| Workflow stage → stage | Stage-exit summary + sealed artifacts become next stage's `binding`/`working` sections |
| Project → Project | Learning harvest promotes durable items to memory tiers; new projects retrieve via memory index, never via raw project files |

## Invariants

1. No agent acts without a packet — “ambient” context is forbidden.
2. `binding` sections are hash-verified; tampering fails the handoff.
3. Every exclusion is recorded — silent context loss is a governance violation.
4. Packets are persisted under `memory/session/<run>/packets/` for audit and replay.
