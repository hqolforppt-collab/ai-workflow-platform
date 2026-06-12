# 2. Folder Structure

Canonical repository layout. Paths are contracts — agents discover capabilities by these well-known locations.

```
aidos/
├── constitution.md                      # Supreme authority (see deliverable 12)
├── README.md                            # OS overview + quickstart
├── VERSION                              # Current OS release (SemVer)
│
├── governance/
│   ├── standards/
│   │   ├── coding-standards.md
│   │   ├── modeling-standards.md        # BPMN/CMMN/DMN conventions
│   │   ├── api-standards.md
│   │   └── security-standards.md
│   ├── policies/
│   │   ├── code-generation-policy.md    # Generation prerequisites (P1)
│   │   ├── data-policy.md
│   │   └── ai-usage-policy.md
│   ├── architecture-rules/
│   │   └── rules.yaml                   # Machine-readable arch constraints
│   ├── naming-conventions.md
│   └── gates/
│       ├── review-gates.yaml            # Who reviews what, when
│       └── quality-gates.yaml           # Pass/fail thresholds
│
├── specifications/
│   ├── _schema/                         # YAML schemas for each spec type
│   ├── business-requirements/
│   ├── functional-requirements/
│   ├── nfr/
│   ├── user-stories/
│   ├── acceptance-criteria/
│   └── decisions/                       # ADRs (adr-NNNN-title.md)
│
├── templates/
│   ├── registry.yaml                    # Template index + versions
│   ├── requirements/
│   ├── architecture/
│   ├── bpmn/
│   ├── cmmn/
│   ├── dmn/
│   ├── forms/
│   ├── api/
│   └── tests/
│
├── skills/
│   ├── registry.yaml                    # Skill index: id, version, status, owner
│   ├── discovery/
│   ├── domain-analysis/
│   ├── bpmn/
│   ├── cmmn/
│   ├── dmn/
│   ├── flowable/
│   ├── security/
│   ├── testing/
│   └── refactoring/
│       └── <skill-id>/
│           ├── SKILL.md                 # Instructions (platform-agnostic)
│           ├── skill.yaml               # Metadata, version, I/O contract
│           └── examples/
│
├── agents/
│   ├── registry.yaml
│   ├── discovery-agent/
│   ├── business-analyst-agent/
│   ├── architect-agent/
│   ├── flowable-agent/
│   ├── data-agent/
│   ├── security-agent/
│   ├── qa-agent/
│   └── governance-agent/
│       ├── charter.md                   # Responsibilities, boundaries
│       ├── agent.yaml                   # Inputs, outputs, context, memory access
│       └── collaboration.yaml           # Handoff contracts with other agents
│
├── memory/
│   ├── index.yaml                       # Master memory index
│   ├── strategic/                       # Long-term enterprise knowledge
│   ├── domain/                          # Per business domain
│   ├── project/                         # Per project context (archived runs)
│   ├── session/                         # Current execution (ephemeral)
│   ├── decisions/                       # Architecture decision memory
│   ├── patterns/                        # Reusable solution patterns
│   └── failures/                        # Lessons learned / anti-patterns
│
├── knowledge/
│   ├── index.yaml                       # RAG index manifest
│   ├── documentation/
│   ├── architecture-assets/
│   ├── flowable-assets/
│   ├── bmad-assets/
│   ├── best-practices/
│   ├── standards/
│   └── playbooks/
│
├── workflow/
│   ├── pipeline.yaml                    # 12-stage pipeline definition
│   └── stages/
│       ├── 01-discovery.yaml
│       ├── 02-analysis.yaml
│       ├── 03-requirements.yaml
│       ├── 04-architecture.yaml
│       ├── 05-review.yaml
│       ├── 06-approval.yaml
│       ├── 07-design.yaml
│       ├── 08-planning.yaml
│       ├── 09-development.yaml
│       ├── 10-testing.yaml
│       ├── 11-validation.yaml
│       └── 12-release.yaml
│
├── quality/
│   ├── reviews/                         # Review checklist definitions
│   ├── scorecards/                      # Scorecard templates + thresholds
│   └── evidence/                        # Gate evidence per project run
│
├── context/
│   ├── compression-policy.md
│   ├── prioritization.yaml              # Context ranking rules
│   └── handoff-protocol.md
│
├── adapters/
│   ├── bmad/adapter.yaml
│   ├── claude-code/adapter.yaml         # Maps skills→/skills, agents→subagents
│   ├── cursor/adapter.yaml              # Maps governance→.cursorrules
│   ├── opencode/adapter.yaml
│   └── codex/adapter.yaml
│
└── projects/
    └── <project-id>/
        ├── project-manifest.yaml        # Pinned OS asset versions + trace root
        ├── specifications/              # Project-instantiated specs
        ├── architecture/
        ├── models/                      # BPMN/CMMN/DMN/forms YAML
        ├── tasks/
        ├── code/
        ├── tests/
        └── gates/                       # Approval records (signed)
```

## Rules

- **Well-known paths are API.** Renaming a top-level folder is a constitutional change.
- **Registries are mandatory.** An asset absent from its `registry.yaml` does not exist to agents.
- **`projects/` is the only writable area during runs**; everything else requires the contribution workflow (PR + governance gate).
- **`memory/session/` is ephemeral** and pruned at run end; durable learnings are promoted per memory lifecycle (deliverable 5).
