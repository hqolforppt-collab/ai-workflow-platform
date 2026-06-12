# Enterprise AI Delivery Operating System (AIDOS)

A reusable, implementation-agnostic AI Delivery Operating System, published as a GitHub repository, executable by BMAD, Claude Code, Cursor, OpenCode, Codex, GPT Agents, and future AI coding platforms.

It transforms the approved Workflow Modeling Platform architecture (`docs/architecture/`) into a reusable **organizational capability** — not a single project.

## Deliverables

| # | Deliverable | Document |
|---|-------------|----------|
| 1 | Repository Architecture | [01-repository-architecture.md](01-repository-architecture.md) |
| 2 | Folder Structure | [02-folder-structure.md](02-folder-structure.md) |
| 3 | Agent Architecture | [03-agent-architecture.md](03-agent-architecture.md) |
| 4 | Skill Architecture | [04-skill-architecture.md](04-skill-architecture.md) |
| 5 | Memory Architecture | [05-memory-architecture.md](05-memory-architecture.md) |
| 6 | Knowledge Architecture | [06-knowledge-architecture.md](06-knowledge-architecture.md) |
| 7 | Governance Architecture | [07-governance-architecture.md](07-governance-architecture.md) |
| 8 | Workflow Architecture | [08-workflow-architecture.md](08-workflow-architecture.md) |
| 9 | Human Approval Architecture | [09-human-approval-architecture.md](09-human-approval-architecture.md) |
| 10 | Context Management Architecture | [10-context-management-architecture.md](10-context-management-architecture.md) |
| 11 | AI Execution Architecture | [11-ai-execution-architecture.md](11-ai-execution-architecture.md) |
| 12 | Repository Constitution Design | [12-repository-constitution.md](12-repository-constitution.md) |
| 13 | Quality Management System | [13-quality-management-system.md](13-quality-management-system.md) |
| 14 | Enterprise Reference Operating Model | [14-enterprise-operating-model.md](14-enterprise-operating-model.md) |

## Design Principles (Binding)

| # | Principle | Enforcement |
|---|-----------|-------------|
| P1 | Specification before implementation | Code generation hard-blocked until approved specs exist |
| P2 | Human approval gates | Every critical stage requires explicit human approval; no autonomous bypass |
| P3 | Traceability | Requirement → Design → Architecture → Task → Code → Test, enforced by trace IDs |
| P4 | Reusable assets first | Template / Skill / Agent / Pattern / Playbook lookup is mandatory before generating new content |
| P5 | Knowledge preservation | Every project run must write back learnings; no learning lost between projects |

## Authority Hierarchy

```
constitution.md                  (highest authority)
  └── governance/ policies & standards
        └── workflow gate definitions
              └── agent charters & skill contracts
                    └── project-level artifacts
```

Lower-level artifacts may never contradict higher-level ones. Conflicts halt execution and escalate to a human.
