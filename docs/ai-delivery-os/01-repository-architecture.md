# 1. Repository Architecture

## Purpose

The repository IS the operating system. Every capability — governance, agents, skills, memory, knowledge, workflow — is expressed as versioned, plain-text artifacts (Markdown + YAML) so that any AI platform can load, interpret, and execute it without proprietary tooling.

## Architectural Style

**Declarative Operating System over Git.**

- **Plain-text kernel** — all behavior is declared in Markdown/YAML; no executable lock-in.
- **Platform adapters, not platform logic** — BMAD, Claude Code, Cursor, etc. consume the same artifacts through thin adapter manifests (`adapters/`).
- **Git as the control plane** — branches model project runs, PRs model approval gates, tags model sealed baselines, history models audit trail.
- **Convention over invocation** — agents discover capabilities by scanning well-known paths (registries), never by hardcoded references.

## Core Subsystems

| Subsystem | Root Path | Role |
|-----------|-----------|------|
| Constitution | `constitution.md` | Supreme authority; mission, rules, constraints |
| Governance | `governance/` | Standards, policies, naming, review & quality gates |
| Specifications | `specifications/` | BRs, FRs, NFRs, stories, acceptance criteria, ADRs |
| Templates | `templates/` | All artifact templates (requirements, BPMN/CMMN/DMN, forms, API, tests) |
| Skills | `skills/` | Atomic, versioned capabilities with registry |
| Agents | `agents/` | Role charters, I/O contracts, collaboration protocols |
| Memory | `memory/` | 7-tier memory (strategic → failure) |
| Knowledge | `knowledge/` | RAG corpus, docs, assets, playbooks |
| Workflow | `workflow/` | 12-stage orchestration definitions with gates |
| Quality | `quality/` | Review checklists, scorecards, gate evidence |
| Context | `context/` | Compression/expansion/handoff policies |
| Adapters | `adapters/` | Per-platform execution manifests |
| Projects | `projects/` | Per-project workspaces instantiated from the OS |

## Separation of Concerns

```
┌─────────────────────────────────────────────────────┐
│ AUTHORITY PLANE    constitution.md + governance/    │
├─────────────────────────────────────────────────────┤
│ CAPABILITY PLANE   agents/  skills/  templates/     │
├─────────────────────────────────────────────────────┤
│ KNOWLEDGE PLANE    memory/  knowledge/              │
├─────────────────────────────────────────────────────┤
│ ORCHESTRATION PLANE workflow/  context/  quality/   │
├─────────────────────────────────────────────────────┤
│ EXECUTION PLANE    adapters/  projects/             │
└─────────────────────────────────────────────────────┘
```

- The **Authority Plane** is read-only during execution; changes require constitutional amendment process (PR + governance approval).
- The **Capability Plane** is read-only during a project run; new skills/templates produced in a run are proposed back via the contribution workflow.
- The **Knowledge Plane** is append-mostly; writes are governed by memory lifecycle rules.
- The **Execution Plane** is the only freely writable area during a run.

## Versioning Model

| Artifact | Scheme | Example |
|----------|--------|---------|
| OS releases | SemVer tags | `aidos-v2.1.0` |
| Skills | SemVer per skill | `skills/bpmn/decompose-process@1.3.0` |
| Templates | SemVer per template | `templates/bpmn/user-task@2.0.0` |
| Agents | SemVer per charter | `agents/architect@1.1.0` |
| Project baselines | Sealed tags | `projects/acme-loans/baseline-3` |

Every project run pins exact versions of every OS asset it consumes in its `project-manifest.yaml`, guaranteeing reproducibility (Principle P3).

## Reuse Lookup Order (Principle P4)

Before any agent generates new content it MUST search, in order:

1. `templates/` — exact template match
2. `skills/` — executable capability match
3. `memory/patterns/` — proven solution pattern
4. `knowledge/playbooks/` — procedural playbook
5. `memory/failures/` — anti-patterns to avoid

Only if all five return no usable match may new content be generated — and the new content must be proposed back as a reusable asset at run completion (Principle P5).
