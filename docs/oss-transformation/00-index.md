# Open Source Repository Transformation — Master Index

Transformation blueprint for `ai-workflow-platform` to become the definitive open-source standard for **Spec-Driven Development + Workflow Engineering + Agentic Software Delivery + Flowable Modeling + AI-Native Enterprise Architecture**.

Targets: **5,000+ stars · 500+ forks · 100+ contributors**.

Builds on the approved foundations:
- [docs/architecture/](../architecture/00-index.md) — AI-driven Flowable model generation architecture
- [docs/ai-delivery-os/](../ai-delivery-os/00-index.md) — Enterprise AI Delivery Operating System (AIDOS)

## Deliverables

### Phase 1: Assessment & Compatibility (Completed)

| # | Deliverable | Document |
|---|-------------|----------|
| 1 | Current Repository Assessment | [01-current-repository-assessment.md](01-current-repository-assessment.md) |
| 2 | BMAD Compatibility Assessment | [02-bmad-compatibility-assessment.md](02-bmad-compatibility-assessment.md) |
| 3 | Claude Code Compatibility Assessment | [03-claude-code-compatibility-assessment.md](03-claude-code-compatibility-assessment.md) |
| 4 | OpenCode Compatibility Assessment | [04-opencode-compatibility-assessment.md](04-opencode-compatibility-assessment.md) |
| 5 | GitHub Copilot Agent Compatibility Assessment | [05-copilot-agent-compatibility-assessment.md](05-copilot-agent-compatibility-assessment.md) |

### Phase 2: Architecture Design (Completed)

| # | Deliverable | Document |
|---|-------------|----------|
| 6 | Repository Operating System Architecture | [06-repository-os-architecture.md](06-repository-os-architecture.md) |
| 7 | Skill Architecture | [07-skill-architecture.md](07-skill-architecture.md) |
| 8 | Memory Architecture | [08-memory-architecture.md](08-memory-architecture.md) |
| 9 | Command Architecture | [09-command-architecture.md](09-command-architecture.md) |
| 10 | Template Architecture | [10-template-architecture.md](10-template-architecture.md) |

### Phase 3: Materialization Planning (CURRENT)

| # | Deliverable | Document | Purpose |
|---|-------------|----------|---------|
| 11 | **Repository Materialization Blueprint** | [11-repository-materialization-blueprint.md](11-repository-materialization-blueprint.md) | **8 Executable Outputs** |

**Phase 3 Outputs:**
1. **Repository Materialization Plan** — For every architecture deliverable (01–10): current state → target state → required files
2. **Repository Creation Backlog** — Epic/Feature/Story/Task format for team-of-agents execution
3. **Adapter Generation Plan** — Exact YAML/file specs for BMAD, Claude Code, OpenCode, Copilot, Cursor, Codex, Gemini
4. **Repository Bootstrap Plan** — Four tracks: git clone, npm create, Docker, Vercel deploy button
5. **Contributor Experience Plan** — 15-minute first-contribution path + onboarding artifacts
6. **Flagship Demo Strategy** — Examples roadmap: 100★ (login-page) → 1K★ (enterprise) → 5K★ (ecosystem)
7. **OSS Growth Materialization** — Legal, governance, community infrastructure per milestone
8. **Execution Sequence** — 8 phased, 17-week implementation plan (dependency graph)

### Phase 4: Implementation (Planned)

| Phase | Focus | Estimated Duration |
|-------|-------|-------------------|
| Phase 1 | Authority & Foundation (constitution, agents, memory, gates) | Weeks 1–2 |
| Phase 2 | Core Adapters (CLAUDE.md, opencode.json, copilot-instructions.md, AGENTS.md) | Weeks 3–4 |
| Phase 3 | Skills & Templates (20 skills + 30 templates + registries) | Weeks 5–7 |
| Phase 4 | Commands & CLI (15 commands + `awp init` + validation tools) | Weeks 8–9 |
| Phase 5 | Examples & Flagship (login-page golden tests + roadmap examples) | Weeks 10–11 |
| Phase 6 | OSS Infrastructure (README, CONTRIBUTING, LICENSE, CI, branch protection) | Weeks 12–13 |
| Phase 7 | Repository Reorganization (docs → .docs/, examples → .examples/) | Weeks 14–15 |
| Phase 8 | Validation & Launch (E2E testing, security audit, public release v1.0.0-ossp) | Weeks 16–17 |

## Transformation Principles

1. **One-command experience** — `git clone` → open → run one command in any AI agent (Claude Code, OpenCode, Copilot, Cursor, Codex, Gemini CLI).
2. **Spec-driven first** — no code before requirements, architecture, and tasks are approved. Enforced structurally, not by convention.
3. **Single source of truth, thin adapters** — all agents, skills, memory, commands, and templates live in tool-neutral `.ai/` core; each platform gets a generated adapter.
4. **Template-first generation** — no AI output without template selection.
5. **Human-in-the-loop is non-negotiable** — Requirements, Architecture, Security, Data Model, Release approvals cannot be bypassed.
6. **Community as architecture** — contribution, governance, and growth are designed systems, not afterthoughts.

## How to Use This Index

1. **Understand Deliverables 01–10:** Read the phase 1 & 2 documents to grasp approved architecture
2. **Read the Materialization Blueprint (Deliverable 11):** Contains all 8 executable outputs
3. **Start Phase 1 Implementation:** Follow the 8-phase execution sequence in Deliverable 11
4. **Use the Backlog:** Epic/Feature/Story/Task structure is directly implementable by AI agents or human teams
5. **Track Progress:** Mark Phase checkpoints as complete; each phase unblocks the next

## Authority Hierarchy

```
.ai/constitution.md (materialized from AIDOS 12)
  ↓
.ai/manifest.yaml (registry of all system components)
  ↓
.agents/, .skills/, .templates/, .commands/, .memory/ (executable system)
  ↓
Generated adapters (CLAUDE.md, opencode.json, etc.)
  ↓
User-facing output (requirements, workflows, Flowable artifacts)
```

Lower levels may never contradict higher levels. Conflicts halt execution and escalate.
