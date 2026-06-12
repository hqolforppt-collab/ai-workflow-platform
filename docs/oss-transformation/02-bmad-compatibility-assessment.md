# Deliverable 2 — BMAD Compatibility Assessment

BMAD (Breakthrough Method for Agile AI-Driven Development) executes via agent persona files, task workflows, templates, and checklists. The repository must run as a native BMAD project without customization.

## 1. Compatibility Matrix

| BMAD Requirement | BMAD Convention | Repo Current State | Action |
|------------------|----------------|--------------------|--------|
| Agent personas | `bmad-core/agents/*.md` (persona, commands, dependencies) | Designed in `ai-delivery-os/03-agent-architecture.md`, not materialized | Generate 6 agent files in `.agents/` + BMAD adapter manifest |
| Agent teams | `agent-teams/*.yaml` | Absent | Create `team-fullstack.yaml` bundling all 6 agents |
| Tasks | `tasks/*.md` step files | Workflow stages exist as docs | Convert 12-stage workflow into BMAD task files |
| Templates | `templates/*.md` with embedded elicitation | Template designs exist | Materialize in `.templates/` (Deliverable 10) |
| Checklists | `checklists/*.md` | Gate criteria exist in governance docs | Extract into per-gate checklists |
| Core config | `core-config.yaml` | Absent | Generate, pointing at `.ai/` core paths |
| Workflows | `workflows/*.yaml` (greenfield/brownfield) | 12-stage pipeline designed | Encode as `greenfield-flowable.yaml` |

## 2. Required Agent Mapping

| Required BMAD Agent | AIDOS Charter Source | Persona ID | Key Commands |
|---------------------|---------------------|------------|--------------|
| Business Analyst | Discovery + Domain Research agents | `analyst` | `/discover`, `/analyze` |
| Product Owner | Requirements Steward | `po` | `/specify`, backlog grooming, gate G1 |
| Architect | Architecture agent | `architect` | `/architect`, `/design`, ADRs, gate G2 |
| Developer | Generation agent | `dev` | `/model`, `/build` (post-gate only) |
| QA | Validation agent | `qa` | `/test`, `/review`, quality gates |
| Governance | Governance/Compliance agent | `governance` | gate enforcement, trace audit, `/release` |

Each agent file must contain: `persona` (role, identity, core principles), `instructions` (activation + operating rules), `memory` (which `.memory/` tiers it reads/writes), `skills` (allowed `.skills/` entries), `templates` (allowed `.templates/` entries), and `quality_gates` (gates it owns or feeds).

## 3. Spec-Driven Enforcement in BMAD Mode

- `dev` agent activation instructions begin with a **hard precondition block**: refuse activation unless `.specs/<project>/requirements.approved.yaml`, `.architecture/<project>/architecture.approved.yaml`, and `tasks.approved.yaml` exist.
- BMAD checklists for gates G1–G5 mirror `.governance/gates/` definitions — single source, BMAD files are generated adapters.
- The BMAD `core-config.yaml` sets `devLoadAlwaysFiles` to the constitution and active spec, guaranteeing context.

## 4. Gaps and Resolutions

1. **No BMAD installer manifest** → add `.ai/adapters/bmad/install-manifest.yaml` so `npx bmad-method install` recognizes the repo as a pre-configured expansion pack ("Flowable Workflow Engineering Pack").
2. **BMAD elicitation format** → templates need BMAD's `[[LLM: ...]]` elicitation markers; add during template materialization.
3. **Agent dependency resolution** → BMAD lazy-loads dependencies; keep each agent file under ~150 lines with references, not inlined content.

## 5. Verdict

**Compatibility achievable with adapters only — no architectural change required.** AIDOS's agent charters are a superset of BMAD personas. Effort: ~20 generated files.
