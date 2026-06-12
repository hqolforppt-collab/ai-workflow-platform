# 9. Knowledge Architecture

## 9.1 Three Knowledge Pillars

```
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│   BMAD PILLAR      │  │   SPEC KIT PILLAR  │  │  CLAUDE SKILLS     │
│                    │  │                    │  │  PILLAR            │
│ Agents, Personas   │  │ Requirement,       │  │ Skills, Commands,  │
│ Workflows          │  │ Architecture,      │  │ Subagents, Prompts │
│ Templates          │  │ Story, Acceptance, │  │ Workflows,         │
│ Instructions       │  │ Task, Spec         │  │ Knowledge Files,   │
│ Quality Gates      │  │ Templates          │  │ Playbooks,         │
│ Review Processes   │  │                    │  │ Templates          │
│ Governance Rules   │  │                    │  │                    │
└─────────┬──────────┘  └─────────┬──────────┘  └─────────┬──────────┘
          │                       │                       │
          ▼                       ▼                       ▼
   BMAD Asset Library     Spec Kit Template Engine   Skill Registry
          │                       │                       │
          └───────────────────────┴───────────────────────┘
                                  │
                    Unified Knowledge Governance
              (one lifecycle, one provenance model, one
               version-pinning mechanism per generation run)
```

## 9.2 BMAD Extraction Architecture

| Concern | Architecture |
|---|---|
| **What is reused** | Agent persona structure; multi-agent workflow patterns (analyst → architect → reviewer chains); document templates; elicitation instructions; quality-gate checklists; review processes; artifact handoff conventions |
| **What is generated** | Project-specific agent activations, workflow instances, filled artifacts, project-scoped governance rules derived from BMAD rule templates |
| **What is customized** | Personas specialized for Flowable/DDD expertise; gates extended with Flowable semantic criteria; workflows extended with the Stage 5 hard gate and the generation lifecycle |
| Storage | BMAD Asset Library: versioned, classified (agent / persona / workflow / template / instruction / gate / review / rule / artifact-type) |
| Binding | Agent Orchestrator and BMAD Workflow Engine resolve assets at run start and pin versions into the manifest |

## 9.3 Claude Code Skills Architecture

| Component | Responsibility |
|---|---|
| **Skill Registry** | Canonical catalog: skill metadata, capability descriptor (what it does, inputs/outputs), domain tags, version history, governance status, owning team |
| **Skill Discovery** | Capability-based queries by agents ("skill for CMMN sentry design in risk domain"); ranking by domain match + governance status + version recency; only `Active` skills discoverable |
| **Skill Execution** | Skills invoked within an agent's governance envelope; execution context records skill version, inputs digest, outputs digest into provenance |
| **Skill Governance** | Same asset lifecycle as Deliverable 8.7; mandatory review gate before activation; deprecation policy with replacement pointers |
| **Skill Versioning** | Semantic versions; runs pin exact versions; breaking changes require new major version and migration note; sealed manifests immune to later changes |

Asset kinds managed: skills, commands, subagents, prompts, workflows, knowledge files, playbooks, templates — all registry entries with the common envelope of Deliverable 7.3.

## 9.4 Spec Kit Architecture

| Engine | Responsibility |
|---|---|
| **Template Selection Engine** | Selects templates by (artifact type × domain × stage); selection rules are governed configuration; fallback hierarchy: domain-specific → industry-generic → platform-default |
| **Template Mapping Engine** | Maps discovered/consolidated content into template slots; unresolvable slots become Open Questions (surfacing at Stage 5), never silent omissions |
| **Specification Generator** | Produces filled specifications (requirements, architecture docs, stories, acceptance criteria, tasks) as YAML artifacts with full provenance and traceability |

Template kinds managed: Requirements, Architecture, Story, Acceptance Criteria, Task, Specification templates.

## 9.5 Best Practice Knowledge Bases (Stage 3 backbone)

- One knowledge base per domain (core + support), curating: industry standards, architecture patterns, design patterns, reference architectures, Flowable best practices, DDD practices, Enterprise Integration Patterns, AI agent patterns, security standards, observability standards.
- Each knowledge base entry is classified as: **Recommended Practice** (advisory), **Mandatory Control** (blocking), **Architecture Constraint** (engine-enforced), or **Governance Rule** (gate-evaluated) — this classification is what Stage 3 emits into the project.
- Knowledge bases are themselves governed assets; per-run pinning guarantees that a sealed project can always be explained against the exact knowledge it was built with.

## 9.6 Knowledge Flow Through the Pipeline

| Stage | Knowledge Consumed |
|---|---|
| 1–2 | Domain ontologies, support-domain catalog, DDD playbooks |
| 3 | Best practice knowledge bases (all relevant domains) |
| 4 | Spec Kit requirement templates, BMAD elicitation instructions |
| 5 | BMAD review process assets, review package templates |
| 6 | Flowable mapping playbooks, root-model rule sets, BMAD architect workflows |
| Generation | Model-type skills, YAML schemas, generation templates |
| Validation/Governance | Gate checklists, governance rules, semantic validation knowledge |
