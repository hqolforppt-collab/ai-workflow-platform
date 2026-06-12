# 11. AI Execution Architecture

## End-to-End Execution Model

How a single story flows through the system:

```
Story
  → Domain          (Discovery + Analysis: domain map, bounded contexts, research)
  → Specification   (BA Agent: BR/FR/NFR, stories, acceptance criteria)  [G3]
  → Architecture    (Architect Agent: spec, ADRs, root model selection)  [G4, G6 seal]
  → Model           (Flowable + Data Agents: BPMN/CMMN/DMN/forms, data dictionary) [G7-data]
  → Task            (Planning: task breakdown + test strategy, trace-linked) [G8]
  → Code            (Development: generation unlocked by code-gen policy only)
  → Test            (QA Agent: execution vs acceptance criteria + NFRs) [G11-sec]
  → Release         (Sealed run + learning harvest) [G12]
```

Each arrow is an artifact handoff with a context packet; each `[G*]` is a human approval gate.

## Trace Chain (Principle P3)

```yaml
story: ST-014
  realizes: BR-003
  refinedBy: [FR-012, FR-013, NFR-004]
    designedBy: [adr-0007, architecture-spec#sec-auth]
      modeledBy: [loanOriginationProcess@1.0, dd-entry: AUDIT_LOG]
        plannedBy: [TASK-031, TASK-032]
          implementedBy: [code: auth/login-service]
            verifiedBy: [TC-091, TC-092]
```

The Governance Agent renders this chain at every gate; a broken link at any level fails the gate.

## Platform-Agnostic Execution Contract

The OS never assumes a specific AI platform. Each platform consumes the same artifacts via its adapter:

```yaml
# adapters/claude-code/adapter.yaml (illustrative)
adapter:
  platform: claude-code
  mappings:
    constitution: load-as: system-rules
    agents/*/charter.md: load-as: subagent-definitions
    skills/*/SKILL.md: load-as: skills
    governance/: load-as: always-on-rules (digest)
    workflow/pipeline.yaml: load-as: orchestration-plan
  contextBudgets:
    architecture-profile: 24000
    development-profile: 32000
```

| Platform | Agents map to | Skills map to | Governance maps to |
|----------|--------------|---------------|--------------------|
| BMAD | BMAD personas | BMAD tasks | BMAD checklists |
| Claude Code | Subagents | Skills | CLAUDE.md / rules |
| Cursor | Composer roles | Prompt snippets | .cursorrules |
| Codex / GPT Agents | Agent definitions | Tool/function specs | System instructions |

Adapters are thin: they map and budget, they never add behavior. Behavior lives only in the OS artifacts.

## Execution Session Protocol

1. **Bootstrap** — load constitution digest + governance digest + project manifest; verify pinned versions.
2. **Stage entry** — verify input gates passed; assemble context packet.
3. **Reuse lookup** — mandatory P4 search; record evidence.
4. **Work** — agent executes licensed skills; writes to `projects/<id>/` and `memory/session/`.
5. **Self-check** — agent runs its declared quality checks before handoff.
6. **Handoff / gate** — produce artifact + packet; Governance Agent audits; human approves where gated.
7. **Checkpoint** — emit stage summary; persist packets for replay.

## Failure & Recovery

| Failure | Recovery |
|---------|----------|
| Session interrupted | Resume from last checkpoint summary + persisted packets |
| Agent produces invalid artifact | Bounded rejection loop (max 3), then human escalation |
| Gate invalidated (sealed artifact changed) | Automatic downstream block; change-request flow re-opens affected stages |
| Platform switch mid-project | New platform adapter + same pinned manifest = identical behavior |

## Determinism Guarantees

- Pinned versions (OS, skills, templates, knowledge index) per project manifest.
- Hash-sealed gate artifacts.
- Persisted context packets.
Together these make any past decision reconstructible: *what did the agent know, which rules applied, who approved.*
