# Repository Materialization Blueprint

Executable transformation plan for `ai-workflow-platform` — converting the AIDOS design from documentation to an operational open-source operating system.

**Authority Base:** All outputs derive from approved deliverables 01–10. No redesign. No reassessment. Implementation only.

**Target Outcome:** Repository that, when cloned and opened in any AI agent (Claude Code, OpenCode, Copilot, Cursor, Codex, Gemini CLI), automatically boots into production state without manual setup.

---

## OUTPUT 1: Repository Materialization Plan

For every approved architecture deliverable, the concrete files required to make it executable.

### 1.1 AIDOS Core (`docs/ai-delivery-os/`)

#### 1.1.1 Constitution & Authority
| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Constitution (supreme authority) | Designed in `12-repository-constitution.md` | Live system file | `.ai/constitution.md` (versioned, enforced in CI) | P0 |
| Governance policies | Designed in `07-governance-architecture.md` | Executable gate definitions | `.governance/gates/*.yaml` (G1–G5 stages) | P0 |
| Authority hierarchy | Documented | Structural enforcement | `.ai/manifest.yaml` (declares authority chain) | P0 |

**Dependencies:** Constitution created first (all other files reference it).

#### 1.1.2 Agents (6 personas)
| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Agent charters | Described in `03-agent-architecture.md` | Executable persona files | `.agents/{analyst,po,architect,dev,qa,governance}/charter.md` | P0 |
| Agent instructions | Designed | Living instructions | `.agents/{agent}/instructions.md` | P0 |
| Memory bindings | Specified | Agent ↔ memory links | `.agents/{agent}/memory-bindings.yaml` | P1 |
| Skill access | Specified | Agent ↔ skill permissions | `.agents/{agent}/skills.yaml` | P1 |
| Template access | Specified | Agent ↔ template permissions | `.agents/{agent}/templates.yaml` | P1 |
| Gate assignments | Specified | Which agent reviews which stage | `.governance/gates/assignments.yaml` | P0 |
| Agent registry | None | Single source of truth for all 6 agents | `.agents/registry.yaml` | P0 |

**Dependencies:** Constitution first; agents depend on established gates and memory structure.

#### 1.1.3 Skills (Versioned Capabilities)
| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| 20+ skill specs | Designed in `04-skill-architecture.md` | Executable skill packages | `.skills/{skill}/skill.yaml` (11 domains × 2–3 skills each) | P1 |
| Skill registry | Documented | Discovery & versioning system | `.skills/registry.yaml` (id, version, status lifecycle) | P1 |
| Skill documentation | Outlined | Live skill docs | `.skills/{skill}/docs/README.md` | P2 |
| Skill examples | None | Runnable examples per skill | `.skills/{skill}/examples/*.yaml` | P2 |
| Skill golden tests | None | Validation tests | `.skills/{skill}/tests/golden.yaml` | P2 |

**Dependencies:** Skills reference constitution, gates, and agents.

#### 1.1.4 Memory System (7-Tier)
| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Memory tiers | Specified in `05-memory-architecture.md` | Physical tier directories | `.memory/{strategic,domain,pattern,decision,project,session,failure}/` | P0 |
| Memory index | Documented | Live registry | `.memory/index.yaml` (all stored memories, reachability graph) | P0 |
| Strategic memory | None | OSS governance principles, decisions | `.memory/strategic/README.md` + `*.md` files | P1 |
| Domain memory | None | Flowable/BPMN/CMMN/DMN patterns | `.memory/domain/{flowable,bpmn,cmmn,dmn}/` | P1 |
| Pattern memory | None | Reusable solution patterns | `.memory/pattern/*.yaml` | P1 |
| Decision memory | None | ADRs and approved architecture decisions | `.memory/decision/{adr-*.md}` | P1 |
| Failure memory | None | Post-mortems, lessons learned | `.memory/failure/*.md` | P2 |
| Memory sync | None | Agent ↔ memory hydration script | `.tools/memory-sync.sh` | P1 |

**Dependencies:** Memory depends on constitution; populated as projects execute.

#### 1.1.5 Workflow System (12-Stage Pipeline)
| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Greenfield workflow | Designed in `08-workflow-architecture.md` | Machine-readable pipeline | `.workflows/greenfield-flowable.yaml` | P1 |
| Brownfield workflow | Specified | Alternative pipeline | `.workflows/brownfield-flowable.yaml` | P1 |
| Stage definitions | Outlined | Gate preconditions & outputs | `.workflows/stages/*.yaml` (S01–S12) | P1 |
| Gate definitions | Specified in governance | Executable gate logic | `.governance/gates/G1–G5.yaml` | P0 |
| Workflow examples | None | Usage examples | `.examples/workflows/` | P2 |

**Dependencies:** Workflows depend on agents, gates, and templates.

#### 1.1.6 Knowledge Management
| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Knowledge index | None | RAG corpus registry | `.knowledge/index.yaml` | P1 |
| Flowable schemas | None | Official Flowable field definitions | `.knowledge/flowable/schemas/*.yaml` | P1 |
| BPMN standards | None | BPMN 2.0 reference | `.knowledge/standards/bpmn2.0-reference.md` | P2 |
| CMMN standards | None | CMMN reference | `.knowledge/standards/cmmn-reference.md` | P2 |
| Research corpus | None | Research PDFs, links | `.knowledge/research/` | P2 |

**Dependencies:** Knowledge is populated as skills and examples mature.

### 1.2 CLI & Commands (`docs/ai-delivery-os/` → `.commands/` + `Deliverable 9`)

| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| 15+ commands | Designed in `09-command-architecture.md` | Executable command definitions | `.commands/{command}/command.yaml` | P1 |
| Command registry | Documented | Live registry | `.commands/registry.yaml` | P1 |
| Command discovery | None | Agent-native discovery | `.commands/DISCOVERY.md` (for Claude, OpenCode, etc.) | P1 |
| Bootstrap command | None | One-command entry point | `.commands/awp-init/` | P0 |
| Validation commands | None | `validate-spec`, `lint-gates`, `audit-trace` | `.commands/{validate,lint,audit}/` | P1 |
| Adapter sync | None | Regenerate platform adapters | `.commands/adapter-sync/` | P1 |

**Dependencies:** Commands depend on constitution, agents, skills, and templates.

### 1.3 Templates & Artifact Generation (`Deliverable 10`)

| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Template registry | Designed | Live template registry | `.templates/registry.yaml` | P1 |
| 30+ templates | Sketched | Executable template files | `.templates/{category}/{template}.yaml` (requirements, user-story, architecture, adr, bpmn, form, page, etc.) | P1 |
| Template examples | None | Example outputs per template | `.templates/{category}/{template}.examples/` | P2 |
| Template golden tests | None | Schema validation tests | `.templates/{category}/{template}.tests/` | P2 |
| Template discovery | None | Template picker UI | `.commands/template-picker/` | P1 |

**Dependencies:** Templates depend on approved meta-model schema.

### 1.4 Platform Adapters (Deliverables 2–5)

#### BMAD Adapter
| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| BMAD instructions | Assessed in `02-bmad-compatibility-assessment.md` | Executable persona files | `.ai/adapters/bmad/agent-teams.yaml` | P0 |
| Agent team definitions | None | BMAD-mapped teams | `.ai/adapters/bmad/teams/{team}/manifest.yaml` | P1 |
| Workflow & task mapping | None | BMAD stage → AWP stage | `.ai/adapters/bmad/workflows.yaml` | P1 |
| Checkpoint templates | None | BMAD-specific checkpoint specs | `.ai/adapters/bmad/checkpoints/` | P1 |

#### Claude Code Adapter
| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Adapter spec | Assessed in `03-claude-code-compatibility-assessment.md` | Generated from `.ai/manifest.yaml` | `CLAUDE.md` (generated, not edited) | P0 |
| Commands | None | Claude Code command definitions | `.ai/adapters/claude/commands.yaml` | P1 |
| Agents | None | Claude Code agent personas | `.ai/adapters/claude/agents.yaml` | P1 |
| Skills | None | Claude Code skill mappings | `.ai/adapters/claude/skills.yaml` | P1 |

#### OpenCode Adapter
| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Adapter spec | Assessed | Generated from `.ai/manifest.yaml` | `opencode.json` (generated, not edited) | P0 |
| Agent definitions | None | OpenCode agent specs | `.ai/adapters/opencode/agents.yaml` | P1 |
| Command mappings | None | OpenCode command system | `.ai/adapters/opencode/commands.yaml` | P1 |

#### GitHub Copilot Adapter
| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Copilot instructions | Assessed | Generated from `.ai/manifest.yaml` | `.github/copilot-instructions.md` (generated, not edited) | P0 |
| Instruction scopes | None | Path-scoped Copilot rules | `.github/instructions/*.md` | P1 |
| Chat modes | None | Copilot agent personas | `.github/chatmodes/*.md` | P1 |
| Prompts | None | Command-triggered prompts | `.github/prompts/*.md` | P1 |

#### Cursor, Codex, Gemini Adapters
| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Agent files | None | Generated adapter stubs | `AGENTS.md` (Cursor, Codex, Gemini) | P1 |
| Cursor rules | None | `.cursor/rules/` per agent | `.ai/adapters/cursor/` | P2 |
| Codex config | None | Codex runtime specs | `.ai/adapters/codex/` | P2 |
| Gemini CLI config | None | Gemini CLI agent defs | `.ai/adapters/gemini/` | P2 |

### 1.5 OSS Infrastructure

| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| License | None | Apache-2.0 legal foundation | `LICENSE` | **P0 BLOCKING** |
| README | Boilerplate | Mission-driven, badges, quick start | `README.md` (rewritten) | **P0 BLOCKING** |
| Contributing guide | None | Path to first contribution | `CONTRIBUTING.md` | P0 |
| Code of Conduct | None | Community standards | `CODE_OF_CONDUCT.md` | P0 |
| Security policy | None | Vulnerability disclosure | `SECURITY.md` | P0 |
| Issue templates | None | Stage-labeled issue forms | `.github/ISSUE_TEMPLATE/*.yaml` | P1 |
| PR template | None | Trace chain checklist | `.github/PULL_REQUEST_TEMPLATE.md` | P1 |
| CI workflows | None | Gate validation, schema lint, adapter sync | `.github/workflows/*.yml` (3–5 workflows) | P1 |
| Branch protection | None | Required checks, CODEOWNERS | `.github/CODEOWNERS`, repository settings | P1 |

### 1.6 Examples & Showcase

| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Flagship example: login-page | Designed in `docs/architecture/test-scenarios/login-page/` | Promoted & executable | `.examples/login-page/` (all YAML specs, form, BPMN, etc.) | P0 |
| Example index | None | Metadata for all examples | `.examples/README.md` + `registry.yaml` | P1 |
| 2nd example: employee-onboarding | None | Procurable workflow | `.examples/employee-onboarding/` | P2 |
| 3rd example: procurement | None | Multi-actor approval flow | `.examples/procurement-workflow/` | P2 |
| 4th example: AI agent | None | Agentic task generation | `.examples/ai-agent-workflow/` | P2 |
| Flowable generation example | None | JSON → YAML → Flowable | `.examples/flowable-generation/` | P2 |

### 1.7 Tooling & Validation

| Artifact | Current State | Target State | Required Files | Priority |
|----------|--------------|--------------|-----------------|----------|
| Schema validators | None | YAML schema validation | `.tools/validate-spec.sh` | P1 |
| Gate validator | None | Verify approvals before merge | `.tools/validate-gates.sh` | P1 |
| Trace auditor | None | Trace requirement → code | `.tools/trace-audit.sh` | P1 |
| Adapter sync | None | Regenerate `CLAUDE.md`, `opencode.json`, etc. from `.ai/manifest.yaml` | `.tools/adapter-sync.sh` | P1 |
| Memory sync | None | Discover orphaned memory, hydrate on startup | `.tools/memory-sync.sh` | P2 |
| One-liner bootstrap | None | Interactive setup script | `scripts/setup.sh` + `npm awp init` | P0 |

### 1.8 Documentation (Reorganized)

| Current | Target | Priority |
|---------|--------|----------|
| `docs/architecture/` | `.docs/architecture/` (content preserved) | P1 |
| `docs/ai-delivery-os/` | `.docs/ai-delivery-os/` (content preserved) | P1 |
| `docs/oss-transformation/` | `.docs/oss-transformation/` (content preserved) | P1 |
| `docs/architecture/test-scenarios/login-page/` | `.examples/login-page/` (promoted) | P0 |
| Root README | Completely rewritten | P0 |

---

## OUTPUT 2: Repository Creation Backlog

Executable backlog formatted as Epic → Feature → Story → Task for team-of-agents execution.

### EPIC 1: Core Authority & Foundation
**Goal:** Constitution, governance gates, and core memory system live and enforced.
**Dependencies:** None (start here)

#### Feature 1.1: Constitution & Authority Chain
**Story 1.1.1:** Constitution Lives in Repository
- Task 1.1.1.1: Copy `docs/ai-delivery-os/12-repository-constitution.md` → `.ai/constitution.md`
- Task 1.1.1.2: Add semantic versioning headers to `.ai/constitution.md` (version 1.0, status: active)
- Task 1.1.1.3: Create `.ai/manifest.yaml` — registry of all agents, skills, templates, commands

**Story 1.1.2:** Governance Gates Become Executable
- Task 1.1.2.1: Extract gate definitions from `docs/ai-delivery-os/07-governance-architecture.md` → `.governance/gates/G1-requirements.yaml`, `.governance/gates/G2-architecture.yaml`, etc.
- Task 1.1.2.2: Define gate preconditions, approval roles, and outputs in YAML schema
- Task 1.1.2.3: Create `.governance/gates/assignments.yaml` — map each gate to responsible agents
- Task 1.1.2.4: Create `.governance/gates/transitions.yaml` — valid stage transitions

**Story 1.1.3:** Authority Hierarchy Enforced
- Task 1.1.3.1: Document enforcement rules in `.governance/GOVERNANCE.md`
- Task 1.1.3.2: Add CI rule: lower-level files cannot conflict with `.ai/constitution.md`
- Task 1.1.3.3: Create `.governance/audit/conflict-detector.sh` (CI script)

#### Feature 1.2: Agent Foundation
**Story 1.2.1:** Six Agents Become Charters
- Task 1.2.1.1: Create `.agents/{analyst,po,architect,dev,qa,governance}/charter.md` — from `03-agent-architecture.md`
- Task 1.2.1.2: Write `.agents/{agent}/instructions.md` — operating principles
- Task 1.2.1.3: Create `.agents/registry.yaml` — unified agent directory

**Story 1.2.2:** Agent Gate Assignments
- Task 1.2.2.1: Map each agent to gates they review (e.g., PO → G1, Architect → G2, Dev → G3)
- Task 1.2.2.2: Update `.governance/gates/assignments.yaml` with agent roles

#### Feature 1.3: Memory Infrastructure
**Story 1.3.1:** Seven Memory Tiers Created
- Task 1.3.1.1: Create `.memory/{strategic,domain,pattern,decision,project,session,failure}/` directories
- Task 1.3.1.2: Create `.memory/index.yaml` — registry of all stored memories
- Task 1.3.1.3: Create `.memory/strategic/README.md` — OSS governance principles

**Story 1.3.2:** Memory Hydration
- Task 1.3.2.1: Write `.tools/memory-sync.sh` — populate memory on agent startup
- Task 1.3.2.2: Document memory access patterns in `.memory/README.md`

---

### EPIC 2: Platform Adapters (Executable)
**Goal:** One repository structure generates valid adapters for 7 platforms.
**Dependencies:** EPIC 1 (constitution, manifest)

#### Feature 2.1: Adapter Generator
**Story 2.1.1:** Adapter Sync Tooling
- Task 2.1.1.1: Create `.tools/adapter-sync.sh` — reads `.ai/manifest.yaml`, generates platform files
- Task 2.1.1.2: Configure CI to run on every merge to `.ai/` (drift detection)
- Task 2.1.1.3: Add `npm run sync-adapters` script to `package.json`

#### Feature 2.2: Claude Code Adapter
**Story 2.2.1:** CLAUDE.md Generated
- Task 2.2.1.1: Create `.ai/adapters/claude/manifest.yaml` — Claude Code capability mapping
- Task 2.2.1.2: Create `.ai/adapters/claude/agents.yaml` — persona definitions
- Task 2.2.1.3: Create template that generates `CLAUDE.md` (not hand-edited)

**Story 2.2.2:** Claude Code Commands
- Task 2.2.2.1: Map each command in `.commands/` → Claude Code `/command` syntax
- Task 2.2.2.2: Test command discovery in Claude Code

#### Feature 2.3: OpenCode Adapter
**Story 2.3.1:** opencode.json Generated
- Task 2.3.1.1: Create `.ai/adapters/opencode/manifest.yaml`
- Task 2.3.1.2: Create template that generates `opencode.json`

**Story 2.3.2:** OpenCode Agents & Commands
- Task 2.3.2.1: Map agents → OpenCode personas
- Task 2.3.2.2: Map commands → OpenCode commands

#### Feature 2.4: GitHub Copilot Adapter
**Story 2.4.1:** Copilot Instructions Generated
- Task 2.4.1.1: Create `.ai/adapters/copilot/manifest.yaml`
- Task 2.4.1.2: Create template that generates `.github/copilot-instructions.md`

**Story 2.4.2:** Copilot Scoped Instructions
- Task 2.4.2.1: Create `.github/instructions/` for path-scoped rules
- Task 2.4.2.2: Create `.github/chatmodes/` for agent personas in Copilot UI

#### Feature 2.5–2.7: Cursor, Codex, Gemini Adapters
**Stories (analogous to 2.2–2.4):**
- Generate `AGENTS.md` (Cursor, Codex, Gemini)
- Create adapter manifests for each platform
- Test in each platform

#### Feature 2.8: BMAD Adapter
**Story 2.8.1:** BMAD Compatibility Layer
- Task 2.8.1.1: Create `.ai/adapters/bmad/agent-teams.yaml` — map AWP agents → BMAD teams
- Task 2.8.1.2: Create `.ai/adapters/bmad/workflows.yaml` — map 12-stage pipeline → BMAD checkpoints
- Task 2.8.1.3: Test BMAD execution of example workflow

---

### EPIC 3: Skills & Templates
**Goal:** Versioned skills and template-first generation system operational.
**Dependencies:** EPIC 1 (agents, memory)

#### Feature 3.1: Skill Registry & Package Structure
**Story 3.1.1:** Create 20+ Skills (Phase 1)
- Task 3.1.1.1: Create `.skills/registry.yaml` — master skill directory
- Task 3.1.1.2: Create `.skills/{skill}/skill.yaml` for each of 20 initial skills:
  - Domain: Flowable Modeling (bpmn-modeling, cmmn-modeling, dmn-modeling, flowable-modeling)
  - Domain: Architecture (ddd-driven, microservices, event-sourcing, api-design)
  - Domain: Security (threat-modeling, encryption, authentication, audit)
  - Domain: Testing (unit, integration, performance, security-testing)
  - Domain: Refactoring (code-smell, design-pattern, performance-refactor)
  - Domain: Documentation (api-docs, adr-writing, architecture-docs)
  - Domain: Database (schema-design, migration, optimization)
  - Domain: DevOps (ci-cd, infrastructure, monitoring, disaster-recovery)
- Task 3.1.1.3: Add skill metadata (id, version, status, dependencies, tags)
- Task 3.1.1.4: Create `.skills/registry.yaml` with versioning lifecycle (draft → review → approved → deprecated → retired)

**Story 3.1.2:** Golden Tests for Skills
- Task 3.1.2.1: Create `.skills/{skill}/tests/golden.yaml` — validation inputs/outputs
- Task 3.1.2.2: Create `.tools/validate-skills.sh` — run golden tests in CI

**Story 3.1.3:** Skill Documentation
- Task 3.1.3.1: Create `.skills/{skill}/docs/README.md` — skill purpose, usage, examples
- Task 3.1.3.2: Create `.skills/{skill}/examples/` with runnable YAML examples

#### Feature 3.2: Template Registry & Generation
**Story 3.2.1:** Create 30+ Templates (Phase 1)
- Task 3.2.1.1: Create `.templates/registry.yaml` — master template directory
- Task 3.2.1.2: Create templates for each category:
  - Requirements: epic, user-story, acceptance-criteria, data-requirement
  - Architecture: architecture-decision-record, data-model, api-specification, component-design
  - Implementation: bpmn-process, cmmn-case, dmn-decision-table, form-definition, page-layout
  - Testing: test-plan, test-case, acceptance-test, performance-test
  - Release: release-notes, deployment-plan, rollback-plan, security-checklist
- Task 3.2.1.3: Add template metadata (id, version, status, schema, examples)
- Task 3.2.1.4: Create `.templates/{category}/{template}.yaml` files

**Story 3.2.2:** Template Schema Validation
- Task 3.2.2.1: Create `.tools/validate-template.sh` — schema validation
- Task 3.2.2.2: Create `.templates/README.md` — template usage guide

**Story 3.2.3:** Template Picker
- Task 3.2.3.1: Create `.commands/template-picker/` — interactive template selection
- Task 3.2.3.2: Test in each agent platform (Claude Code, OpenCode, Copilot)

---

### EPIC 4: Commands & CLI
**Goal:** One-command bootstrap and 15+ operational commands.
**Dependencies:** EPIC 1–3 (agents, skills, templates)

#### Feature 4.1: Bootstrap Command
**Story 4.1.1:** awp init Command
- Task 4.1.1.1: Create `.commands/awp-init/command.yaml` — bootstrap entry point
- Task 4.1.1.2: Create `scripts/setup.sh` — interactive configuration
- Task 4.1.1.3: Create `package.json` script: `npm run awp:init`
- Task 4.1.1.4: Test one-liner: `git clone <repo> && cd ai-workflow-platform && npm run awp:init`

**Story 4.1.2:** Agent Discovery
- Task 4.1.2.1: Create `.commands/DISCOVERY.md` — agent auto-detection
- Task 4.1.2.2: Test discovery in Claude Code, OpenCode, Copilot

#### Feature 4.2: Validation & Audit Commands
**Story 4.2.1:** Spec Validation
- Task 4.2.1.1: Create `.commands/validate-spec/command.yaml`
- Task 4.2.1.2: Create `.tools/validate-spec.sh` — schema validation for YAML specs
- Task 4.2.1.3: Add CI workflow that runs on every PR

**Story 4.2.2:** Gate Validation
- Task 4.2.2.1: Create `.commands/validate-gates/command.yaml`
- Task 4.2.2.2: Create `.tools/validate-gates.sh` — enforce approval chain
- Task 4.2.2.3: Add branch protection rule: gate validation required

**Story 4.2.3:** Trace Audit
- Task 4.2.3.1: Create `.commands/audit-trace/command.yaml`
- Task 4.2.3.2: Create `.tools/trace-audit.sh` — verify requirement → design → code traceability
- Task 4.2.3.3: Add CI workflow

#### Feature 4.3: Generation Commands
**Story 4.3.1:** Adapter Sync
- Task 4.3.1.1: Create `.commands/adapter-sync/command.yaml`
- Task 4.3.1.2: Implement in `.tools/adapter-sync.sh` (regenerate all platform files)
- Task 4.3.1.3: Add CI enforcement (edited adapter files → CI failure)

**Story 4.3.2:** Memory Sync
- Task 4.3.2.1: Create `.commands/memory-sync/command.yaml`
- Task 4.3.2.2: Implement in `.tools/memory-sync.sh` (hydrate memory on startup)

#### Feature 4.4: Agent-Facing Commands (12 remaining)
**Story 4.4.1–4.4.12:** Per `.commands/registry.yaml`
- Task: Create each of the 12 additional commands from `09-command-architecture.md`
- Examples: `new-project`, `new-requirement`, `new-epic`, `design-api`, `design-data-model`, `generate-bpmn`, `generate-form`, `generate-page`, `run-test`, `deploy`, `retrospective`

---

### EPIC 5: Examples & Flagship Projects
**Goal:** Flagship `login-page` example runs end-to-end; 5 examples planned for star milestones.
**Dependencies:** EPIC 1–4 (all systems working)

#### Feature 5.1: Flagship Example — Login Page
**Story 5.1.1:** Promote & Finalize
- Task 5.1.1.1: Move `docs/architecture/test-scenarios/login-page/` → `.examples/login-page/`
- Task 5.1.1.2: Verify all YAML specs reference `.examples/login-page/` paths
- Task 5.1.1.3: Create `.examples/login-page/README.md` — walkthrough guide

**Story 5.1.2:** Golden Test
- Task 5.1.2.1: Create `.examples/login-page/test/golden.yaml` — inputs, outputs, assertions
- Task 5.1.2.2: Create CI workflow to run example test on every merge

#### Feature 5.2: Example Registry
**Story 5.2.1:** Examples Discoverable
- Task 5.2.1.1: Create `.examples/README.md` — index of all examples
- Task 5.2.1.2: Create `.examples/registry.yaml` — metadata (name, stage, domains, skills)

#### Feature 5.3: 2nd–5th Examples (Planned for 1K–5K star milestones)
**Story 5.3.1–5.3.5:** Scaffold (specs only, implementation deferred)
- Task 5.3.1.1: Create `.examples/employee-onboarding/` spec structure
- Task 5.3.2.1: Create `.examples/procurement-workflow/` spec structure
- Task 5.3.3.1: Create `.examples/ai-agent-workflow/` spec structure
- Task 5.3.4.1: Create `.examples/flowable-generation/` spec structure
- Task 5.3.5.1: Create `.examples/multi-tenant-saas/` spec structure (stretch)

---

### EPIC 6: OSS Infrastructure & Governance
**Goal:** Repository is discoverable, welcoming, and legally compliant.
**Dependencies:** EPIC 1–5 (substance complete)

#### Feature 6.1: Legal & Licensing
**Story 6.1.1:** License Added
- Task 6.1.1.1: Create `LICENSE` file (Apache-2.0 template)
- Task 6.1.1.2: Add copyright headers to all core files

**Story 6.1.2:** Security Policy
- Task 6.1.2.1: Create `SECURITY.md` — vulnerability disclosure process

#### Feature 6.2: Documentation
**Story 6.2.1:** README Rewritten
- Task 6.2.1.1: Replace boilerplate README with mission-driven `README.md`
  - Value proposition: spec-driven workflow engineering for enterprise
  - Quick start (one-liner)
  - Badges (license, build, stars, PRs)
  - Feature highlights (AIDOS, Flowable generation, multi-platform agents)
  - Examples with links
  - Roadmap teaser
  - Contributing call-to-action

**Story 6.2.2:** Contributor Path
- Task 6.2.2.1: Create `CONTRIBUTING.md` — contribution guidelines, first-issue strategy
- Task 6.2.2.2: Create `CODE_OF_CONDUCT.md` — community standards (Contributor Covenant)
- Task 6.2.2.3: Create `.github/CODEOWNERS` — code owners per directory

#### Feature 6.3: Issue & PR Workflow
**Story 6.3.1:** Issue Templates
- Task 6.3.1.1: Create `.github/ISSUE_TEMPLATE/requirements.yaml` — stage G1
- Task 6.3.1.2: Create `.github/ISSUE_TEMPLATE/architecture.yaml` — stage G2
- Task 6.3.1.3: Create `.github/ISSUE_TEMPLATE/bug-report.yaml` — defects
- Task 6.3.1.4: Create `.github/ISSUE_TEMPLATE/feature-request.yaml` — enhancements

**Story 6.3.2:** PR Template & Enforcement
- Task 6.3.2.1: Create `.github/PULL_REQUEST_TEMPLATE.md` — trace chain checklist
- Task 6.3.2.2: Add branch protection: require gate validation

#### Feature 6.4: CI Enforcement
**Story 6.4.1:** CI Workflows
- Task 6.4.1.1: Create `.github/workflows/lint.yml` — schema validation, spelling
- Task 6.4.1.2: Create `.github/workflows/gates.yml` — gate enforcement on PR
- Task 6.4.1.3: Create `.github/workflows/adapters.yml` — verify adapter consistency
- Task 6.4.1.4: Create `.github/workflows/examples.yml` — run example golden tests

**Story 6.4.2:** Branch Protection
- Task 6.4.2.1: Require passing status checks before merge
- Task 6.4.2.2: Require PR review from CODEOWNERS
- Task 6.4.2.3: Dismiss stale reviews on push

---

### EPIC 7: Repository Reorganization
**Goal:** Move existing docs into `.docs/`, repurpose `site/`, clean up root.
**Dependencies:** All other EPICs (content is stable)

#### Feature 7.1: Docs Reorganization
**Story 7.1.1:** Migrate Docs
- Task 7.1.1.1: Move `docs/architecture/` → `.docs/architecture/`
- Task 7.1.1.2: Move `docs/ai-delivery-os/` → `.docs/ai-delivery-os/`
- Task 7.1.1.3: Move `docs/oss-transformation/` → `.docs/oss-transformation/`
- Task 7.1.1.4: Update all internal links

**Story 7.1.2:** Promote Examples
- Task 7.1.2.1: Move `docs/architecture/test-scenarios/login-page/` → `.examples/login-page/`

#### Feature 7.2: Site Repurposing
**Story 7.2.1:** Convert to Docs Site
- Task 7.2.1.1: Repurpose `site/` (or `web/`) as Next.js docs site
- Task 7.2.1.2: Add pages:
  - `/` — hero with mission, quick-links
  - `/docs/` — static docs (read `.docs/`)
  - `/examples/` — runnable examples (read `.examples/`)
  - `/roadmap/` — 5K-star roadmap
  - `/governance/` — constitution, contributing
- Task 7.2.1.3: Deploy to Vercel (automatic on main)

---

### EPIC 8: Materialization Validation & Launch
**Goal:** Everything runs end-to-end; repository ready for public launch.
**Dependencies:** All other EPICs complete

#### Feature 8.1: Integration Tests
**Story 8.1.1:** End-to-End Workflow
- Task 8.1.1.1: Test: `git clone` → `awp init` → pick project → run command → verify output
- Task 8.1.1.2: Test: new requirement → G1 review → approve → move to G2 (complete pipeline)
- Task 8.1.1.3: Test in each agent (Claude Code, OpenCode, Copilot, Cursor)

**Story 8.1.2:** Adapter Consistency
- Task 8.1.2.1: Verify `CLAUDE.md`, `opencode.json`, `.github/copilot-instructions.md` all auto-sync
- Task 8.1.2.2: Test: edit `.ai/manifest.yaml` → run adapter-sync → verify changes propagate

#### Feature 8.2: Readiness Checklist
**Story 8.2.1:** Launch Validation
- Task 8.2.1.1: Verify all 8 outputs of materialization plan are complete
- Task 8.2.1.2: Verify all backlog items closed
- Task 8.2.1.3: Verify CI passing 100%
- Task 8.2.1.4: Verify no adapter files manually edited (all generated)
- Task 8.2.1.5: Security audit of `.ai/constitution.md` enforcement
- Task 8.2.1.6: Final README, LICENSE, CONTRIBUTING review

#### Feature 8.3: Public Launch
**Story 8.3.1:** Release
- Task 8.3.1.1: Create release tag `v1.0.0-ossp` (OSS Public)
- Task 8.3.1.2: Push to GitHub public repo
- Task 8.3.1.3: Enable GitHub Discussions for community
- Task 8.3.1.4: Create launch announcement

---

## OUTPUT 3: Adapter Generation Plan

Exact files required for each platform to ingest `ai-workflow-platform` as a native agent, skill, and command source.

### 3.1 BMAD Adapter

**Goal:** BMAD agents/teams/workflows execute AWP pipeline and produce Flowable artifacts.

#### Files to Create
```
.ai/adapters/bmad/
├── agent-teams.yaml              # 6 AWP agents → BMAD team definitions
├── workflows.yaml                # 12-stage pipeline → BMAD checkpoints
├── checkpoints/
│   ├── G1-requirements.yaml       # BMAD checkpoint for requirements gate
│   ├── G2-architecture.yaml       # ... for architecture gate
│   ├── G3-implementation.yaml
│   ├── G4-qa.yaml
│   └── G5-release.yaml
├── tasks/
│   ├── task-definitions.yaml      # BMAD task templates
│   └── checklists/
│       ├── requirements-checklist.yaml
│       ├── architecture-checklist.yaml
│       ├── implementation-checklist.yaml
│       ├── qa-checklist.yaml
│       └── release-checklist.yaml
├── examples/
│   └── login-page-bmad-run.yaml   # Execution trace of login-page through BMAD
└── docs/
    └── README.md                  # BMAD integration guide
```

#### Content Specifications

**`agent-teams.yaml`**
```yaml
version: "1.0"
platform: bmad
mapping:
  - awp_agent: "Analyst"
    bmad_team: "Discovery"
    role: "Requirements gathering"
    
  - awp_agent: "PO"
    bmad_team: "Planning"
    role: "Roadmap management"
    
  - awp_agent: "Architect"
    bmad_team: "Design"
    role: "Architecture decisions"
    
  - awp_agent: "Dev"
    bmad_team: "Development"
    role: "Implementation"
    
  - awp_agent: "QA"
    bmad_team: "Testing"
    role: "Quality assurance"
    
  - awp_agent: "Governance"
    bmad_team: "Governance"
    role: "Approvals and audit"
```

**`workflows.yaml`**
```yaml
version: "1.0"
pipeline:
  greenfield_flowable:
    stages:
      - stage: "S01: Initial Concept"
        bmad_checkpoint: "checkpoint_01_discovery"
        gates: ["G1: Requirements Approved"]
        
      - stage: "S02: Domain Analysis"
        bmad_checkpoint: "checkpoint_02_analysis"
        gates: ["G1: Domain Approved"]
        
      # ... S03–S12 continuing pattern
      
    gate_mapping:
      G1: "bmad_review_requirements"
      G2: "bmad_review_architecture"
      G3: "bmad_review_implementation"
      G4: "bmad_review_qa"
      G5: "bmad_release_approval"
```

**Checkpoint YAML files** (e.g., `G1-requirements.yaml`)
```yaml
version: "1.0"
bmad_checkpoint: "checkpoint_01_requirements"
awp_gate: "G1"
preconditions:
  - "Requirement template completed"
  - "Domain model approved"
  - "Acceptance criteria defined"
outputs:
  - "Approved requirement spec"
  - "User story list"
  - "Data dictionary"
approvers:
  - role: "Product Owner"
  - role: "Domain Analyst"
duration_days: 3
escalation_path: "Product Manager"
```

**Checklist files** (e.g., `requirements-checklist.yaml`)
```yaml
version: "1.0"
stage: "G1: Requirements"
items:
  - id: "REQ-001"
    description: "Requirement ID and version assigned"
    required: true
    
  - id: "REQ-002"
    description: "User story template populated"
    required: true
    
  - id: "REQ-003"
    description: "Acceptance criteria specified (Given-When-Then)"
    required: true
    
  - id: "REQ-004"
    description: "Data requirements identified"
    required: true
    
  - id: "REQ-005"
    description: "Domain model cross-checked"
    required: true
    
  - id: "REQ-006"
    description: "Stakeholders identified"
    required: false
    
  - id: "REQ-007"
    description: "Risk assessment completed"
    required: false
```

---

### 3.2 Claude Code Adapter

**Goal:** `CLAUDE.md` provides Claude Code with agents, commands, skills, and instructions.

#### Files to Create
```
.ai/adapters/claude/
├── manifest.yaml                 # Claude Code capability mapping
├── agents.yaml                   # Claude Code agent definitions
├── commands.yaml                 # Command-to-Claude-Code mappings
├── skills.yaml                   # Skill availability matrix
└── docs/
    └── README.md                 # Claude Code integration guide

# Generated (not edited manually):
CLAUDE.md                          # Auto-generated from manifest.yaml
```

#### Content Specifications

**`manifest.yaml`**
```yaml
version: "1.0"
platform: "Claude Code"
adapter_status: "active"
capabilities:
  - agent_discovery: true
  - command_execution: true
  - skill_lookup: true
  - template_selection: true
  - memory_access: true
  - gate_validation: true
  
# Command discovery paths
command_discovery:
  - prefix: "/"
    source: ".commands/"
    examples:
      - "/awp-init"
      - "/validate-spec"
      - "/new-requirement"
      
# Agent registration
agents:
  - name: "Analyst"
    id: "analyst"
    scope: "requirements"
    
  - name: "Architect"
    id: "architect"
    scope: "architecture"
    
  # ... etc
    
# Skill exposure
skills:
  discovery_method: "registry_lookup"
  registry: ".skills/registry.yaml"
  
# Template exposure
templates:
  discovery_method: "registry_lookup"
  registry: ".templates/registry.yaml"
```

**`CLAUDE.md` (generated template)**
```markdown
# AI Workflow Platform for Claude Code

**Agents:** Analyst, PO, Architect, Dev, QA, Governance

**Commands:**
- `/awp-init` — Initialize project
- `/validate-spec` — Validate spec YAML
- `/new-requirement` — Create requirement
- ... (15+ commands)

**Skills:**
- [Flowable Modeling Skills]
- [Architecture Skills]
- ... (20+ skills)

**Templates:**
- [Requirements Templates]
- [Architecture Templates]
- ... (30+ templates)

**Quick Start:**
\`\`\`
/awp-init
# Follow prompts to initialize project
\`\`\`

See `.ai/adapters/claude/` for full configuration.
```

---

### 3.3 OpenCode Adapter

**Goal:** `opencode.json` provides OpenCode with agents and commands.

#### Files to Create
```
.ai/adapters/opencode/
├── manifest.yaml                 # OpenCode capability mapping
├── agents.yaml                   # OpenCode agent definitions
├── commands.yaml                 # Command-to-OpenCode mappings
└── docs/
    └── README.md                 # OpenCode integration guide

# Generated (not edited manually):
opencode.json                      # Auto-generated from manifest.yaml
```

#### Content Specifications

**`opencode.json` (generated template)**
```json
{
  "version": "1.0",
  "platform": "OpenCode",
  "agents": [
    {
      "id": "analyst",
      "name": "Analyst",
      "description": "Requirements and domain analysis",
      "instructions": "Focus on gathering requirements...",
      "skills": ["domain-analysis", "requirement-specification"],
      "templates": ["user-story", "acceptance-criteria"]
    },
    {
      "id": "architect",
      "name": "Architect",
      "description": "System design and architecture",
      "instructions": "Focus on scalable design...",
      "skills": ["architecture-design", "data-modeling"],
      "templates": ["architecture-decision-record", "component-design"]
    }
  ],
  "commands": [
    {
      "id": "awp-init",
      "name": "awp init",
      "description": "Initialize project",
      "action": "execute .commands/awp-init/command.yaml"
    },
    {
      "id": "validate-spec",
      "name": "validate spec",
      "description": "Validate spec YAML",
      "action": "execute .commands/validate-spec/command.yaml"
    }
  ]
}
```

---

### 3.4 GitHub Copilot Adapter

**Goal:** `.github/copilot-instructions.md` provides Copilot with agents, scoped rules, and chat modes.

#### Files to Create
```
.ai/adapters/copilot/
├── manifest.yaml                 # Copilot capability mapping
├── agents.yaml                   # Copilot chat mode definitions
├── scoped-rules.yaml             # Path-scoped instruction rules
├── prompts.yaml                  # Prompt templates per command
└── docs/
    └── README.md                 # Copilot integration guide

# Generated (not edited manually):
.github/copilot-instructions.md    # Auto-generated from manifest.yaml
.github/instructions/              # Generated path-scoped rule files
.github/chatmodes/                 # Generated chat mode definitions
.github/prompts/                   # Generated prompt files
```

#### Content Specifications

**`.github/copilot-instructions.md` (generated template)**
```markdown
# Copilot Instructions for AI Workflow Platform

## Constitution
All decisions must align with `.ai/constitution.md`. The constitution is the highest authority.

## Agents (Chat Modes)
- **@Analyst** — Focus on requirements and domain analysis
- **@Architect** — Focus on system design and architecture
- **@Dev** — Focus on implementation
- **@QA** — Focus on testing and quality
- **@Governance** — Focus on approvals and governance

## Scoped Rules
- In `.ai/` or `.governance/`: Require trace IDs and authority checks
- In `.examples/`: Preserve test scenario integrity
- In `.commands/`: Validate command YAML schema

## How to Use
1. Type `@Analyst` to activate Analyst agent mode
2. Ask questions or request generation
3. Copilot will reference constitution, agents, skills, templates, memory
```

**Path-scoped instructions** (e.g., `.github/instructions/.ai.md`)
```markdown
# Rules for .ai/ directory (AI Operating System Core)

**Protection Level:** HIGHEST

- Edits to `.ai/constitution.md` require explicit authorization
- Edits to `.ai/manifest.yaml` trigger adapter regeneration (CI)
- All edits trace to approved architecture
- Changes below proposal require human review before merge

**Allowed:**
- Read any file
- Propose changes with traceability

**Blocked:**
- Direct edits without approval trail
```

---

### 3.5 Cursor, Codex, Gemini CLI Adapters

#### Files to Create (simplified, mirrors architecture above)

**Cursor:**
```
.ai/adapters/cursor/
├── manifest.yaml
├── agents.yaml
└── docs/README.md

AGENTS.md  # Generated
```

**Codex:**
```
.ai/adapters/codex/
├── manifest.yaml
├── agents.yaml
└── docs/README.md

AGENTS.md  # Generated
```

**Gemini CLI:**
```
.ai/adapters/gemini/
├── manifest.yaml
├── agents.yaml
└── docs/README.md

AGENTS.md  # Generated
```

#### `AGENTS.md` (template for Cursor, Codex, Gemini)
```markdown
# AI Agents for [Platform]

## Available Agents

- **Analyst** — Requirements and domain analysis
- **PO** — Product ownership and backlog
- **Architect** — System design
- **Dev** — Implementation
- **QA** — Testing and quality
- **Governance** — Approvals and audit

## Quick Start

See `.ai/adapters/[platform]/manifest.yaml` for full configuration.
```

---

## OUTPUT 4: Repository Bootstrap Plan

Design for **one-command installation** enabling immediate productivity.

### 4.1 Recommended Approach: Multi-Track

| Track | Command | UX | Target Users |
|-------|---------|----|----|
| **Track A: Git Clone** | `git clone <repo> && cd ai-workflow-platform && npm run awp:init` | Shell + interactive prompts | Developers, architects |
| **Track B: npm create** | `npm create awp@latest` | npm scaffolding | Web developers, fast track |
| **Track C: Docker** | `docker run -it awp:latest` | Container + interactive shell | DevOps, quick experiments |
| **Track D: Cloud** | Vercel/GitHub quick-deploy button | URL click → instant preview | Non-technical, showcasing |

### 4.2 Primary Flow: `npm run awp:init`

#### User Journey
```
git clone https://github.com/ai-workflow-platform/ai-workflow-platform
cd ai-workflow-platform
npm install
npm run awp:init

# Interactive menu (Inquirer.js):
? Which platform are you using? (Claude Code / OpenCode / Copilot / Cursor / Codex / Gemini CLI)
> Claude Code

? Select a starting project:
  (1) Login Page (Flagship Example)
  (2) Employee Onboarding (Workflow Example)
  (3) Blank Project
> Login Page

? Would you like to open the example docs? (y/n)
> y
# Opens .examples/login-page/README.md

? Ready to begin? Commands available:
  - /awp-init (already done ✓)
  - /validate-spec
  - /new-requirement
  - ... (15+ commands)

Which command next?
> /validate-spec
```

#### Implementation Files

**`scripts/setup.sh`**
```bash
#!/bin/bash

echo "🚀 AI Workflow Platform Bootstrap"
echo ""
echo "Checking environment..."

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org/"
  exit 1
fi

# Install dependencies
npm install

# Run interactive setup
npm run awp:setup

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review .ai/constitution.md"
echo "  2. Pick an agent from .agents/"
echo "  3. Run: npm run awp:commands"
```

**`package.json` scripts**
```json
{
  "scripts": {
    "awp:init": "node scripts/awp-init.mjs",
    "awp:setup": "node scripts/awp-setup.mjs",
    "awp:commands": "node scripts/command-menu.mjs",
    "awp:validate": "bash .tools/validate-spec.sh",
    "awp:sync": "bash .tools/adapter-sync.sh"
  }
}
```

**`scripts/awp-init.mjs`**
```javascript
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

const platforms = [
  'Claude Code',
  'OpenCode',
  'GitHub Copilot',
  'Cursor',
  'Codex',
  'Gemini CLI'
];

const projects = [
  { name: 'Login Page (Flagship)', path: '.examples/login-page' },
  { name: 'Employee Onboarding', path: '.examples/employee-onboarding' },
  { name: 'Blank Project', path: '.specs/new-project' }
];

(async () => {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'platform',
      message: 'Which platform are you using?',
      choices: platforms
    },
    {
      type: 'list',
      name: 'project',
      message: 'Select a starting project:',
      choices: projects.map(p => p.name)
    },
    {
      type: 'confirm',
      name: 'openDocs',
      message: 'Open example docs?',
      default: true
    }
  ]);

  console.log(`\n✅ Initialized for ${answers.platform}`);
  console.log(`📂 Project: ${answers.project}`);
  
  if (answers.openDocs) {
    console.log(`\n📖 Opening docs...`);
    // Open browser or display README
  }

  console.log(`\n🚀 Next: Pick an agent from .agents/ and start!`);
})();
```

### 4.3 Secondary Flow: `npm create awp`

**`create-awp/index.mjs`**
```javascript
// Scaffolds a new project locally without cloning entire repo
// Creates skeleton: .specs/, .governance/, example commands

const template = `
ai-workflow-project/
├── .specs/
│   └── my-project/
│       ├── requirements.yaml
│       ├── stories/
│       └── tasks.yaml
├── .agents/
│   └── [linked to main repo .agents/]
├── README.md
└── .awp/
    └── config.json
`;

// Implementation scaffolds minimal project, provides links to main repo
```

### 4.4 Tertiary Flow: Docker Container

**`Dockerfile`**
```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .
RUN npm install
RUN npm run awp:sync

EXPOSE 3000
CMD ["npm", "run", "awp:interactive"]
```

### 4.5 Quaternary Flow: Vercel Deploy Button

**`README.md` Deploy Button**
```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fai-workflow-platform%2Fai-workflow-platform&project-name=awp-demo&repository-name=awp-demo)
```

Deploys docs site + interactive playground to Vercel (from `site/`).

---

## OUTPUT 5: Contributor Experience Plan

Goal: **New contributor productive within 15 minutes**.

### 5.1 Entry Experience

**Touchpoint 1: GitHub Repo Landing**
- Hero statement: "Spec-Driven Development + Workflow Engineering for AI Agents"
- Value proposition badge (300 words max)
- Feature highlights (5 bullets)
- **Huge "Getting Started" CTA button**

**Touchpoint 2: README.md (full)**
- Mission statement
- Quick-start command (copy-paste)
- Screenshots/GIFs of agents in action
- 3 example links (5-minute each)
- Contribution roadmap (what to work on)
- Badge row (license, build status, PRs welcome, stars, forks)

**Touchpoint 3: CONTRIBUTING.md**
- Philosophy: "Every contribution aligns with constitution"
- First-issue strategy: tag issues `good-first-issue`
- Workflow: fork → branch → PR → review → merge
- Development setup (2 commands)
- Testing (1 command)
- PR checklist (trace requirements)

### 5.2 Onboarding Artifacts

#### Document 1: `QUICK_START.md` (5-minute read)
```markdown
# Quick Start (5 minutes)

1. **Clone**
   git clone <repo> && cd ai-workflow-platform

2. **Setup**
   npm install && npm run awp:init

3. **Pick an agent**
   ls .agents/

4. **Try a command**
   npm run awp:commands

5. **Read an example**
   cat .examples/login-page/README.md
```

#### Document 2: `ARCHITECTURE_OVERVIEW.md` (10-minute read)
```markdown
# Architecture Overview

## The Operating System Model

This repo IS the OS. Not a library or framework.

### Directories (Single Source of Truth)
- `.ai/` — Constitution, manifest, adapters
- `.agents/` — Six agent charters
- `.skills/` — 20+ versioned capabilities
- `.templates/` — 30+ generation templates
- `.commands/` — 15+ user-facing commands
- `.memory/` — 7-tier learning system
- `.governance/` — Gates, approvals, audit

### Platforms (Generated Adapters)
- `CLAUDE.md` — Claude Code
- `opencode.json` — OpenCode
- `.github/copilot-instructions.md` — Copilot
- `AGENTS.md` — Cursor, Codex, Gemini

### Design Principles (Non-Negotiable)
- P1: Spec before code
- P2: Human approval gates
- P3: Traceability everywhere
- P4: Template-first generation
- P5: Constitution is supreme law

See `.ai/constitution.md` for full authority hierarchy.
```

#### Document 3: `TUTORIAL_NEW_REQUIREMENT.md` (15-minute hands-on)
```markdown
# Tutorial: Add a New Requirement

In this tutorial, you'll navigate the system like a Product Owner:
1. Create a requirement spec
2. Submit for G1 review
3. See it move through the pipeline

### Step 1: Create Requirement
\`\`\`bash
npm run awp:commands
# Select: "new-requirement"
\`\`\`

This opens `.commands/new-requirement/command.yaml`, which uses the
requirement template from `.templates/requirements/requirement.yaml`.

Output: `.specs/my-project/requirements/req-001.yaml`

### Step 2: Validate
\`\`\`bash
npm run awp:validate
\`\`\`

Checks schema against `.templates/` + constitution.

### Step 3: Submit for Review
\`\`\`bash
git checkout -b feature/req-001
git add .specs/my-project/requirements/req-001.yaml
git commit -m "feat: add requirement req-001 [trace-id: ...] [stage: G1]"
git push
\`\`\`

GitHub PR triggers CI:
- Validates spec schema
- Checks trace ID
- Routes to PO for G1 review (CODEOWNERS)

### Step 4: Follow Through Pipeline
Gate G1 approved → Stage S02 → Gate G2 (Architect review) → ...

See `.governance/gates/` to understand gate definitions.
```

#### Document 4: `TUTORIAL_ADD_SKILL.md` (15-minute hands-on)
```markdown
# Tutorial: Add a New Skill

In this tutorial, you'll become a Skill Author:
1. Define skill spec
2. Write golden tests
3. Register with system

### Step 1: Skill Template
\`\`\`bash
mkdir -p .skills/my-skill/{docs,examples,tests}
cat > .skills/my-skill/skill.yaml << 'EOF'
id: my-skill
version: 0.1.0
status: draft
category: custom
description: "My custom skill"
dependencies: []
EOF
\`\`\`

### Step 2: Golden Test
\`\`\`bash
cat > .skills/my-skill/tests/golden.yaml << 'EOF'
- input:
    data: "..."
  expected_output:
    result: "..."
EOF
\`\`\`

### Step 3: Register
Update `.skills/registry.yaml` — add entry for `my-skill`.

### Step 4: Validate & Test
\`\`\`bash
npm run awp:validate
bash .tools/validate-skills.sh
\`\`\`

### Step 5: Submit PR
PR → reviewed by Governance agent → merged when golden tests pass.

See `.skills/registry.yaml` for skill lifecycle (draft → review → approved).
```

### 5.3 Examples & Videos

| Medium | Content | Duration | Goal |
|--------|---------|----------|------|
| Video 1 | "Welcome to AWP" (platform overview) | 3 min | Hook interest |
| Video 2 | "One-minute setup" (npm run awp:init) | 1 min | Reduce friction |
| Video 3 | "Create a requirement" (walkthrough) | 5 min | First success |
| Video 4 | "The constitution" (governance 101) | 3 min | Understand PHiL |
| Tutorial 1 | New Requirement (text) | 15 min | First contribution |
| Tutorial 2 | Add Skill (text) | 15 min | Second contribution |
| Tutorial 3 | Design API (text) | 20 min | Architecture track |
| Example 1 | Login Page (run-through) | 30 min | Understand full pipeline |

### 5.4 Community Feedback Loop

**Contribution Metrics (tracked)**
- Time to first contribution
- Time to second contribution
- Net new contributors per month
- Skill/template adoptions

**Feedback channels:**
- GitHub Discussions for questions
- Issues for feature requests
- PRs for contributions
- Quarterly retrospectives (in `.memory/failure/`)

---

## OUTPUT 6: Flagship Demo Strategy

Roadmap of examples for each star milestone (100 → 1K → 5K).

### 6.1 100 Stars: Prove Core Concept

**Example: Login Page (In Progress)**
- **Artifact:** `.examples/login-page/`
- **Deliverables:**
  - User story (YAML)
  - Domain model (YAML)
  - BPMN process diagram
  - CMMN case model
  - DMN decision tables
  - HTML form definition
  - Flowable Process Definition (JSON)
  - Test scenario (golden test YAML)
- **Demonstrates:** Full lifecycle from requirement → executable workflow
- **Success metric:** "100 stars achieved by demonstrating login-page generates valid Flowable artifacts"

### 6.2 1,000 Stars: Prove Enterprise Applicability

**Example 1: Employee Onboarding**
- **Artifact:** `.examples/employee-onboarding/`
- **Deliverables:**
  - Multi-stage approval workflow (newbie → manager → HR → IT)
  - Form generation (onboarding form, IT checklist form)
  - Service integration points (HRIS, email, document management)
  - BPMN process (8–10 tasks, 3–5 gateways)
  - Test scenario: normal path + approval denial path
- **Demonstrates:** Real enterprise workflow with conditional logic
- **Success metric:** "1K stars achieved; enterprise architects recognize onboarding as credible proof"

**Example 2: Procurement Workflow**
- **Artifact:** `.examples/procurement-workflow/`
- **Deliverables:**
  - Purchase request form
  - Multi-level approval (department manager → budget owner → CFO)
  - Integration points (accounting system, vendor DB)
  - BPMN with complex gateways (budget < $5K vs > $50K)
  - DMN decision tables for auto-approval rules
- **Demonstrates:** Budget-aware conditional routing; real business logic
- **Success metric:** "Credibility with Finance/Procurement teams"

### 6.3 5,000 Stars: Prove Extensibility & Community

**Example 1: AI Agent Workflow**
- **Artifact:** `.examples/ai-agent-workflow/`
- **Deliverables:**
  - Agent request form (task, priority, context)
  - Agent skill selection (routing logic)
  - Parallel agent tasks (multiple agents working simultaneously)
  - Feedback loop (human review → agent refinement)
  - CMMN case model (flexible, non-deterministic)
- **Demonstrates:** AWP used for *agent orchestration itself* — eating our own dog food
- **Success metric:** "Developers building agents choose AWP as foundation"

**Example 2: Flowable Generation Pipeline**
- **Artifact:** `.examples/flowable-generation/`
- **Deliverables:**
  - Input: English prose + structured templates
  - Output: BPMN 2.0 XML → Flowable Process Definition (JSON)
  - Demonstration of YAML → JSON transformation
  - Test: 10 business processes (E2E)
- **Demonstrates:** AWP is generator, not just modeler
- **Success metric:** "Community submits their processes via template; AWP generates deployable workflows"

**Example 3: Microservices Orchestration** (if 5K+ growth continues)
- **Artifact:** `.examples/microservices-saga/`
- **Deliverables:**
  - Multi-step saga pattern (order → payment → inventory → shipping)
  - Compensation logic (rollback on failure)
  - Choreography option (events) vs. Orchestration (AWP)
  - Integration with Kafka/RabbitMQ
- **Demonstrates:** AWP scales to distributed systems
- **Success metric:** "Cloud-native architects adopt AWP"

### 6.4 Showcase Strategy

**For Each Example:**

1. **README** (3–5 minute read)
   - Business scenario
   - Key flows (happy path + alternatives)
   - File structure walkthrough
   - How to run it

2. **Walkthrough Video** (5–10 minutes)
   - Live demo in agent (Claude Code, Copilot)
   - Generate requirement → validate → approve → execute
   - Show generated BPMN, form, Flowable artifact

3. **GitHub Discussion** (community Q&A)
   - Link to example
   - Encourage variations ("What if customer doesn't pay?")
   - Community submissions

4. **Blog Post** (enterprise audience)
   - Business value
   - Technical architecture
   - Lessons learned
   - Use-case applications

---

## OUTPUT 7: OSS Growth Materialization

Exact files required to reach 100 → 1K → 5K stars and establish credible project.

### 7.1 Legal & Governance Infrastructure

**Milestone: 100 Stars (Immediate)**

| File | Purpose | Content |
|------|---------|---------|
| `LICENSE` | Apache-2.0 | Standard OSS license (patent grant for enterprise) |
| `SECURITY.md` | Vulnerability disclosure | Process for responsible disclosure |
| `CODE_OF_CONDUCT.md` | Community standards | Contributor Covenant or similar |
| `.github/CODEOWNERS` | Code ownership | Governance agent team + repo maintainers |
| `CONTRIBUTING.md` | Contribution workflow | Fork → branch → PR → review → merge + traceability |
| `.github/ISSUE_TEMPLATE/` | Issue forms | Stage-labeled: G1 (req), G2 (arch), G3 (impl), bug, feature |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR checklist | Trace ID, stage gate, approvals |

**Milestone: 1K Stars**

| File | Purpose | Content |
|------|---------|---------|
| `ROADMAP.md` | Public roadmap | 1K → 5K milestones, planned examples, features |
| `.github/DISCUSSIONS_TEMPLATE.md` | Discussions setup | Enable GitHub Discussions for community Q&A |
| `CHANGELOG.md` | Release notes | v1.0-ossp release notes, upcoming v1.1 |
| `.github/ISSUE_TEMPLATE/showcase.yaml` | Community showcase | "Show us your process!" template |
| `AWARDS.md` or `SUPPORTERS.md` | Recognition | Early adopters, community contributions |

**Milestone: 5K Stars**

| File | Purpose | Content |
|------|---------|---------|
| `GOVERNANCE_COUNCIL.md` | Leadership | Core maintainers, governance committee, decision process |
| `FUNDING.md` | Sustainability | Open Collective, GitHub Sponsors, enterprise support |
| `.github/workflows/mirrors.yml` | Multi-platform | Auto-mirror to GitLab, Gitea (if applicable) |
| `TRANSLATIONS.md` | Localization | Community translation contributors |

### 7.2 Documentation Infrastructure

**Milestone: 100 Stars**

**File: `README.md` (Rewritten)**
```markdown
# AI Workflow Platform

Spec-Driven Development + Workflow Engineering for Enterprise AI Agents.

### What is AWP?

The first open-source operating system for building, validating, and executing business processes as composable AI-native workflows. Available natively in Claude Code, OpenCode, GitHub Copilot, Cursor, and beyond.

### Quick Start

```bash
git clone https://github.com/ai-workflow-platform/ai-workflow-platform.git
cd ai-workflow-platform
npm run awp:init
```

### Features

- **Spec-Driven:** Requirements → Architecture → Code (enforced)
- **Multi-Agent:** Analyst, PO, Architect, Dev, QA, Governance agents
- **Flowable-Native:** Generate BPMN/CMMN/DMN → Flowable Process Definitions
- **Template-First:** 30+ generation templates, extensible
- **Governed:** Constitution + 5-gate approval pipeline
- **Multi-Platform:** Claude Code, OpenCode, Copilot, Cursor, Codex, Gemini

### Examples

- [Login Page](#) — Flagship example (5 min)
- [Employee Onboarding](#) — Enterprise workflow (10 min)
- [Procurement](#) — Budget-aware approval (10 min)

### Roadmap

- 100★: Core concept proven (you are here)
- 1K★: Enterprise examples (Q3 2024)
- 5K★: Community-driven examples (Q4 2024)

### Contributing

First contribution? See [CONTRIBUTING.md](CONTRIBUTING.md).

### License

Apache-2.0 — See [LICENSE](LICENSE).
```

**File: `CONTRIBUTING.md`**
```markdown
# Contributing to AWP

We're building the future of enterprise workflow engineering. Your contribution matters.

### Philosophy

Every contribution:
1. Aligns with `.ai/constitution.md` (highest authority)
2. Traces requirements → design → code
3. Passes gate validation (CI)
4. Respects community standards (CODE_OF_CONDUCT)

### Getting Started

1. Pick an issue tagged `good-first-issue`
2. Fork, branch, make changes
3. Submit PR with trace ID
4. Wait for review (48 hours)
5. Merged on approval

### What to Work On

- Examples (`.examples/`) — Add your own workflow
- Skills (`.skills/`) — Extend capabilities
- Templates (`.templates/`) — New generation templates
- Docs — Clarify, translate, improve

### Development Setup

```bash
git clone <your-fork>
cd ai-workflow-platform
npm install
npm run awp:validate  # Ensure setup works
```

### Making Changes

1. Create branch: `git checkout -b feature/short-description`
2. Make changes
3. Validate: `npm run awp:validate`
4. Commit: `git commit -m "feat: description [trace-id: ...] [stage: G3]"`
5. Push: `git push origin feature/...`
6. Open PR

### PR Checklist

- [ ] Traceability: PR describes requirement/story/task (trace ID)
- [ ] Gate assignment: Indicates stage (G1–G5)
- [ ] Tests: Golden tests pass if applicable
- [ ] Docs: README/docs updated if needed
- [ ] No manual adapter edits: Only `.ai/` changes; adapters auto-regenerate
- [ ] Constitution-aligned: No conflicts with `.ai/constitution.md`

### Review Process

1. **Governance Agent** reviews for compliance (24 hours)
2. **Maintainer** technical review (24 hours)
3. **Merge** on approval

Timelines are best-effort SLAs; complex changes may take longer.

### Questions?

- GitHub Discussions: Ask in #contributing
- Issues: Use `kind/question` label
- Email: [governance@awp.local]

### Code of Conduct

All contributors agree to [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Welcome to the movement. 🚀
```

**File: `CODE_OF_CONDUCT.md`**
```markdown
# Contributor Covenant Code of Conduct

Our community is committed to providing a welcoming, harassment-free environment.

## Our Pledge

We, as members, contributors, and leaders, commit to making participation in our
community a harassment-free experience for everyone, regardless of age, body
size, disability, ethnicity, gender identity and expression, level of
experience, nationality, personal appearance, race, religion, or sexual
identity and orientation.

## Our Standards

Examples of behavior that creates a positive environment include:
- Using welcoming and inclusive language
- Being respectful of differing opinions, viewpoints, and experiences
- Giving and gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior include:
- Harassment, discrimination, or hateful language
- Trolling, insulting/derogatory comments, or personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the maintainers at conduct@awp.local. All complaints will be
reviewed and investigated promptly.

Maintainers have the right and responsibility to remove, edit, or reject
comments, commits, code, issues, and other contributions that are not aligned
with this Code of Conduct.

## Attribution

This Code of Conduct is adapted from the Contributor Covenant, version 2.0.
```

**File: `ROADMAP.md` (Milestone: 1K Stars)**
```markdown
# Project Roadmap

## 100★ (Current) — Core Concept Proven
- ✅ Constitution & governance system
- ✅ Six-agent model (Analyst, PO, Architect, Dev, QA, Governance)
- ✅ Login-page flagship example
- ✅ CLAUDE.md, opencode.json, copilot-instructions auto-generation
- ✅ 20+ skills, 30+ templates in registry

## 1K★ (Q3 2024) — Enterprise Proven
- 🔄 Employee onboarding example (multi-approver, conditional routing)
- 🔄 Procurement workflow example (budget-aware, compliance-tagged)
- 🔄 Integration guides (Flowable, AWS, Azure, GCP)
- 🔄 Community examples (submissions via GitHub Discussions)
- 🔄 CLI enhancements (`awp validate`, `awp trace`, `awp generate`)

## 5K★ (Q4 2024) — Ecosystem Leader
- 🔲 AI agent orchestration example
- 🔲 Flowable generation pipeline (YAML → BPMN → JSON)
- 🔲 Microservices saga pattern example
- 🔲 Partner integrations (Atlassian, ServiceNow, SAP)
- 🔲 Certified training program
- 🔲 Managed cloud service (awp.cloud, private beta)

## 10K★ (2025) — Enterprise Standard
- 🔲 Native BPMN/CMMN modeling IDE
- 🔲 Flowable runtime embedment guide
- 🔲 ISO 27001 compliance template library
- 🔲 Multi-language code generation
- 🔲 Mobile-friendly form generation
```

### 7.3 Community & Growth Channels

**Milestone: 100 Stars**

| Channel | Purpose | Action |
|---------|---------|--------|
| GitHub README | Awareness | Epic hero statement + link to 3 examples |
| GitHub Releases | Updates | v1.0-ossp release + v1.1 alpha notes |
| GitHub Discussions | Q&A | Enable, seed with FAQs |
| GitHub Topics | Discoverability | Add: workflow, bpmn, spec-driven, agentic-ai |

**Milestone: 1K Stars**

| Channel | Purpose | Action |
|---------|---------|--------|
| Twitter/X | Announcements | Weekly tips, example highlights, contributor spotlights |
| Blog (on `site/`) | Authority | "Why Spec-Driven Development Works", "AI Agents Meet Workflows" |
| YouTube | Tutorial | 5–10 min videos: setup, new requirement, add skill |
| Hacker News | Launch | "Show HN: AI Workflow Platform" |
| Product Hunt | Launch | Featured launch (10K+ upvotes potential) |

**Milestone: 5K Stars**

| Channel | Purpose | Action |
|---------|---------|--------|
| Podcast | Story | Interview founding team on AI/workflow intersection |
| Conference | Thought leadership | Talk at Flowable Summit, KubeCon, or domain-specific conf |
| Certification | Credentialing | "Certified AWP Architect" (optional) |
| Partner Program | Ecosystem | Integration partnerships (Atlassian, ServiceNow, etc.) |

### 7.4 Showcase Infrastructure

**GitHub Showcase Page** (as Discussion pinned post)
```markdown
# Community Showcase

Show us your workflows! Add your process definition here:

| Org | Process | Domains | Status |
|-----|---------|---------|--------|
| TechCorp | API Deployment Pipeline | DevOps | ✅ In production |
| HealthPlus | Patient Onboarding | Healthcare | ✅ In production |
| FinanceHub | Credit Approval | Finance | ✅ Testing |
| ...| ... | ... | ... |

**Submit your process:** Reply with:
- Organization name
- Process name
- Primary domains
- Link to `.examples/your-process/`
- Status (design / testing / production)
```

---

## OUTPUT 8: Execution Sequence

Exact phase order to build the complete repository (dependency-aware).

### Phase 1: Authority & Foundation (Weeks 1–2)

**Goal:** Establish governance and infrastructure so all subsequent work is traceable and approved.

**Deliverables:**
1. `.ai/constitution.md` ← Live from `docs/ai-delivery-os/12-repository-constitution.md`
2. `.ai/manifest.yaml` ← Registry of all agents, skills, templates, commands
3. `.agents/` (6 charters) ← All agent definitions
4. `.governance/gates/` (G1–G5) ← Gate definitions and assignments
5. `.memory/` (7-tier structure) ← Directory structure + index
6. `LICENSE` (Apache-2.0)
7. `CONTRIBUTING.md` (basic)
8. `.github/CODEOWNERS`

**Tasks:**
- [ ] Copy constitution to `.ai/constitution.md` (Task 1.1.1.1)
- [ ] Create `.ai/manifest.yaml` (Task 1.1.1.3)
- [ ] Create `.agents/{agent}/charter.md` for 6 agents (Task 1.2.1.1)
- [ ] Create gate YAML files (Task 1.1.2.1)
- [ ] Create memory directories (Task 1.3.1.1)
- [ ] Add license, contributing docs (Tasks 6.1.1.1, 6.2.2.1)
- [ ] Configure CODEOWNERS (Task 6.4.2.2)

**Definition of Done:**
- Constitution enforced via `.github/` branch protection
- Gate assignments define approval roles
- CODEOWNERS reflects agent-based governance
- All files CI-validated (schema passing)

**Rationale:** Without authority and governance, all subsequent work is untraced. Constitution first; everything else follows.

---

### Phase 2: Core Adapters (Weeks 3–4)

**Goal:** Agents can discover AWP in their native platforms.

**Deliverables:**
1. `.ai/adapters/` (7 platform manifests)
2. `CLAUDE.md` (generated)
3. `opencode.json` (generated)
4. `.github/copilot-instructions.md` (generated)
5. `AGENTS.md` (Cursor, Codex, Gemini)
6. `.tools/adapter-sync.sh` (CI automation)

**Tasks:**
- [ ] Create `.ai/adapters/{bmad,claude,opencode,copilot,cursor,codex,gemini}/manifest.yaml` (Task 2.1–2.8)
- [ ] Implement `.tools/adapter-sync.sh` (Task 2.1.1.1)
- [ ] Create adapter generation templates (Tasks 2.2.1.2, 2.3.1.2, etc.)
- [ ] Generate initial adapters (run adapter-sync)
- [ ] Add CI workflow: `.github/workflows/adapters.yml` (Task 6.4.1.3)
- [ ] Test discovery in each platform

**Definition of Done:**
- Each platform can auto-discover AWP agents + commands
- `CLAUDE.md`, `opencode.json` auto-generated (manual edits fail CI)
- Drift detection working (edited adapter files → CI failure)

**Rationale:** Adapters are the "surface" of the OS. Once created, the remaining work (skills, templates, commands) becomes discoverable.

---

### Phase 3: Skills & Templates (Weeks 5–7)

**Goal:** Generation and guidance system fully operational.

**Deliverables:**
1. `.skills/` (20 initial skills + registry)
2. `.templates/` (30 initial templates + registry)
3. `.tools/validate-*.sh` (validation scripts)
4. `.skills/registry.yaml`, `.templates/registry.yaml`
5. `.commands/template-picker/` (interactive selector)
6. Golden tests for skills and templates

**Tasks:**
- [ ] Create 20 skills (Flowable, Architecture, Security, Testing, Refactoring, Documentation, Database, DevOps) (Task 3.1.1.2)
- [ ] Create 30 templates (Requirements, Architecture, Implementation, Testing, Release) (Task 3.2.1.2)
- [ ] Add skill/template metadata (Task 3.1.1.3, 3.2.1.3)
- [ ] Write golden tests (Tasks 3.1.2.1, 3.2.1.4)
- [ ] Implement validation scripts (Tasks 3.1.2.2, 3.2.2.1)
- [ ] Create template picker (Task 3.2.3.1)
- [ ] Add CI workflows: lint skills/templates on every commit

**Definition of Done:**
- All 20 skills tested + passing CI
- All 30 templates validated against schema
- Template picker works in each agent
- CI blocks PRs with invalid schemas

**Rationale:** Skills and templates are the "libraries" of the OS. Once in place, agents and users have real capabilities.

---

### Phase 4: Commands & CLI (Weeks 8–9)

**Goal:** 15+ commands fully operational; one-liner bootstrap working.

**Deliverables:**
1. `.commands/` (registry + 15 commands)
2. `scripts/awp-init.mjs` + `scripts/setup.sh`
3. `.tools/adapter-sync.sh` + `.tools/validate-spec.sh` + `.tools/validate-gates.sh` + `.tools/trace-audit.sh`
4. `npm run awp:*` scripts in `package.json`
5. Adapter-specific command mappings (Claude, OpenCode, etc.)

**Tasks:**
- [ ] Create `.commands/awp-init/` (Task 4.1.1.1)
- [ ] Create remaining 14 commands from `09-command-architecture.md` (Task 4.4.1–4.4.12)
- [ ] Implement `scripts/awp-init.mjs`, `scripts/setup.sh` (Tasks 4.1.1.2, 4.1.1.3)
- [ ] Implement validation scripts (Tasks 4.2.1.2, 4.2.2.2, 4.2.3.2)
- [ ] Create CI workflow: command validation (Task 4.2.1.3)
- [ ] Test one-liner: `git clone ... && npm run awp:init` (Task 4.1.1.4)

**Definition of Done:**
- All 15 commands discoverable in each agent
- `npm run awp:init` completes in <2 minutes
- All commands return valid YAML or execution results
- CI validates command schemas on merge

**Rationale:** Commands are how users interact with the system. Once operational, the system is usable end-to-end.

---

### Phase 5: Examples & Flagship (Weeks 10–11)

**Goal:** Flagship example runs end-to-end; showcase strategy deployed.

**Deliverables:**
1. `.examples/login-page/` (promoted from test scenario)
2. `.examples/` registry and index
3. Golden tests for login-page (`.examples/login-page/test/golden.yaml`)
4. `.examples/employee-onboarding/` (skeleton for 1K-star phase)
5. `.examples/procurement-workflow/` (skeleton for 1K-star phase)
6. Example CI workflow (run golden tests on merge)
7. Example walkthrough videos + blog posts (planned content)

**Tasks:**
- [ ] Promote login-page test scenario to `.examples/login-page/` (Task 5.1.1.1)
- [ ] Verify all YAML references (Task 5.1.1.2)
- [ ] Create golden test (Task 5.1.2.1)
- [ ] Create `.examples/README.md` + registry (Tasks 5.2.1.1, 5.2.1.2)
- [ ] Scaffold employee-onboarding + procurement-workflow (Tasks 5.3.1–5.3.3)
- [ ] Add CI workflow: run example tests (Task 5.1.2.2)
- [ ] Create walkthrough documentation (`.examples/login-page/README.md`)
- [ ] Plan video + blog content (planning phase, deferred)

**Definition of Done:**
- Login-page produces valid BPMN/CMMN/DMN/Flowable artifacts
- Golden test passes in CI
- New contributors can follow login-page end-to-end (15 min)
- Roadmap public (ROADMAP.md)

**Rationale:** Examples are how credibility is built. Login-page proves the core concept; onboarding + procurement prove enterprise applicability.

---

### Phase 6: OSS Infrastructure (Weeks 12–13)

**Goal:** Repository is discoverable, welcoming, and community-ready.

**Deliverables:**
1. `README.md` (rewritten, mission-driven)
2. `SECURITY.md`, `CODE_OF_CONDUCT.md`, `ROADMAP.md`
3. GitHub issue + PR templates (stage-labeled, trace-required)
4. GitHub Discussions setup
5. `.github/workflows/` (lint, gates, adapters, examples)
6. GitHub branch protection + CODEOWNERS finalized
7. `site/` (Next.js docs site)

**Tasks:**
- [ ] Rewrite `README.md` (Task 6.2.2.1)
- [ ] Create security, code-of-conduct, roadmap (Tasks 6.1.2.1, 6.2.2.2, 7.2)
- [ ] Create issue/PR templates (Tasks 6.3.1.1–6.3.1.4, 6.3.2.1)
- [ ] Enable GitHub Discussions (Task 7.2)
- [ ] Create CI workflows: lint, gates, adapters, examples (Tasks 6.4.1.1–6.4.1.4)
- [ ] Enable branch protection (Task 6.4.2.1–6.4.2.3)
- [ ] Repurpose `site/` as docs + examples browser (Task 7.2.1.1–7.2.1.3)
- [ ] Deploy `site/` to Vercel

**Definition of Done:**
- `README.md` attracts potential contributors
- Issue/PR process is clear (trace-required)
- CI fully enforced (no merges without passing checks)
- Docs site live and navigable
- First GitHub Discussion seeded with FAQ

**Rationale:** OSS infrastructure is what enables community growth. Constitution alone isn't enough; the experience must invite participation.

---

### Phase 7: Repository Reorganization (Weeks 14–15)

**Goal:** Directory structure matches materialization plan exactly.

**Deliverables:**
1. Documentation in `.docs/` (not `docs/`)
2. Examples in `.examples/` (not `docs/architecture/test-scenarios/`)
3. Dot-directories fully populated (`.agents/`, `.skills/`, `.templates/`, `.commands/`, `.memory/`, `.governance/`)
4. Internal link updates (all docs link to new paths)
5. All deprecation notices removed

**Tasks:**
- [ ] Move `docs/architecture/` → `.docs/architecture/` (Task 7.1.1.1)
- [ ] Move `docs/ai-delivery-os/` → `.docs/ai-delivery-os/` (Task 7.1.1.2)
- [ ] Move `docs/oss-transformation/` → `.docs/oss-transformation/` (Task 7.1.1.3)
- [ ] Move login-page → `.examples/login-page/` (already done in Phase 5)
- [ ] Update all internal links (Task 7.1.1.4)
- [ ] Remove old `docs/` directory
- [ ] Verify CI still passes

**Definition of Done:**
- Directory structure matches Output 1 layout exactly
- All links valid (no 404s)
- CI passing

**Rationale:** Clean structure is essential for newcomer experience. Phase 5 promoted examples; Phase 7 cleans up the remaining docs.

---

### Phase 8: Validation & Launch (Weeks 16–17)

**Goal:** Everything works end-to-end; repository ready for public announcement.

**Deliverables:**
1. Integration tests (E2E workflow)
2. Adapter consistency verification
3. Security audit (constitution enforcement)
4. Launch checklist
5. Release tag `v1.0.0-ossp`
6. Public GitHub release

**Tasks:**
- [ ] E2E test: git clone → awp init → new requirement → G1 review → approve (Task 8.1.1.1)
- [ ] E2E test in each agent: Claude Code, OpenCode, Copilot, Cursor (Task 8.1.1.3)
- [ ] Adapter consistency: edit `.ai/manifest.yaml` → run adapter-sync → verify propagation (Task 8.1.2.2)
- [ ] Security audit: verify constitution enforcement in CI (Task 8.2.1.5)
- [ ] Readiness checklist: verify all outputs complete (Task 8.2.1.1–8.2.1.6)
- [ ] Create release tag `v1.0.0-ossp` (Task 8.3.1.1)
- [ ] Push to GitHub public (Task 8.3.1.2)
- [ ] Create GitHub release with announcement (Task 8.3.1.3)
- [ ] Enable Discussions if not already (Task 8.3.1.4)

**Definition of Done:**
- All integration tests passing
- No CI failures on any branch
- Constitution enforcement verified
- GitHub release published
- README + ROADMAP linked in release

**Rationale:** Validation ensures we ship a complete, usable system. Launch is the culmination of 17 weeks of materialization work.

---

### Timeline Summary

```
Phase 1 (Wk 1–2):   Authority & Foundation      [CRITICAL PATH: Foundation]
Phase 2 (Wk 3–4):   Core Adapters               [DEPENDENT: Phase 1]
Phase 3 (Wk 5–7):   Skills & Templates          [DEPENDENT: Phase 2]
Phase 4 (Wk 8–9):   Commands & CLI              [DEPENDENT: Phase 3]
Phase 5 (Wk 10–11): Examples & Flagship         [DEPENDENT: Phase 4]
Phase 6 (Wk 12–13): OSS Infrastructure          [DEPENDENT: Phase 5]
Phase 7 (Wk 14–15): Reorganization              [DEPENDENT: Phase 6]
Phase 8 (Wk 16–17): Validation & Launch         [DEPENDENT: Phase 7]

Total: 17 weeks to production-ready OSS repository
```

---

## Conclusion

This **Repository Materialization Blueprint** transforms the approved AIDOS and AWP architecture from documentation into an executable, community-ready open-source repository. Each of the 8 outputs provides concrete guidance for implementation:

1. **Materialization Plan** — What files must exist
2. **Creation Backlog** — How to build them (Epic/Feature/Story/Task)
3. **Adapter Generation** — Platform-specific system integration
4. **Bootstrap Plan** — One-command setup
5. **Contributor Experience** — 15-minute to productive
6. **Flagship Demo Strategy** — Growth from 100 to 5K+ stars
7. **OSS Growth Materialization** — Legal, governance, community infrastructure
8. **Execution Sequence** — Phased, 17-week implementation plan

**Authority:** All decisions derive from approved deliverables 01–10 (AIDOS + Architecture). No redesign. Implementation only.

**Next Step:** Approve this blueprint; begin Phase 1 (Authority & Foundation) immediately.
