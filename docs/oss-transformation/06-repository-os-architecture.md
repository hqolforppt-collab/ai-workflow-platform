# Deliverable 6 — Repository Operating System Architecture

The repository IS the operating system. This deliverable materializes the AIDOS design (`docs/ai-delivery-os/`) into the required physical structure.

## 1. Target Repository Structure

```text
ai-workflow-platform/
├── .github/                      # GitHub-native surface
│   ├── copilot-instructions.md   # Copilot adapter (generated)
│   ├── instructions/             # Path-scoped Copilot rules
│   ├── prompts/                  # Copilot prompt files (commands)
│   ├── chatmodes/                # Copilot agent personas
│   ├── ISSUE_TEMPLATE/           # Stage-labeled issue forms
│   ├── PULL_REQUEST_TEMPLATE.md  # Trace-chain checklist
│   └── workflows/                # CI: gate validation, schema lint, adapter sync
│
├── .ai/                          # ★ CANONICAL CORE (single source of truth)
│   ├── constitution.md           # Supreme authority (from AIDOS 12)
│   ├── manifest.yaml             # OS version, capability index, adapter registry
│   └── adapters/                 # Adapter generators + manifests per platform
│       ├── bmad/  claude/  opencode/  copilot/  cursor/  codex/  gemini/
│
├── .agents/                      # 6 agent charters (persona, instructions,
│   ├── analyst/  po/  architect/ #   memory bindings, skills, templates, gates)
│   ├── dev/  qa/  governance/
│   └── registry.yaml
│
├── .skills/                      # Versioned skill packages
│   ├── registry.yaml             # id, version, status (draft→review→approved→deprecated→retired)
│   ├── bpmn-modeling/  cmmn-modeling/  dmn-modeling/  flowable-modeling/
│   ├── ddd/  architecture/  security/  testing/  refactoring/  documentation/
│
├── .templates/                   # Template-first generation (Deliverable 10)
│   ├── registry.yaml
│   ├── requirements/  user-story/  epic/  architecture/  adr/
│   ├── bpmn/  cmmn/  dmn/  api/  form/  page/  dashboard/  test/  release/
│
├── .memory/                      # 7-tier memory (Deliverable 8)
│   ├── index.yaml
│   ├── strategic/  domain/  pattern/  decision/  project/  session/  failure/
│
├── .knowledge/                   # RAG corpus: Flowable schemas, BPMN/CMMN/DMN
│   ├── flowable/  standards/  domains/  research/
│
├── .specs/                       # Spec-driven artifacts (per project)
│   └── <project>/ requirements.yaml  stories/  tasks.yaml
│
├── .architecture/                # Approved architectures + ADRs per project
│   └── <project>/ architecture.yaml  adrs/  data-model.yaml
│
├── .workflows/                   # 12-stage pipeline definitions (machine-readable)
│   ├── greenfield-flowable.yaml  └── stages/
│
├── .governance/                  # Gates, approvals, trace, audit
│   ├── gates/ (G1-requirements … G5-release)
│   ├── approvals/  trace/  audit/
│
├── .examples/                    # Flagship examples (login-page first)
│   └── login-page/               # Promoted from docs/architecture/test-scenarios
│
├── .docs/                        # Architecture corpus (relocated docs/)
├── .tools/                       # validate-spec, enforce-gates.sh, adapter-sync, trace-audit
├── .playbooks/                   # Scenario runbooks (new-domain, brownfield, migration)
├── .commands/                    # ★ Canonical command definitions (Deliverable 9)
│
├── CLAUDE.md  AGENTS.md          # Claude / open-standard adapters (generated)
├── opencode.json                 # OpenCode adapter (generated)
├── LICENSE (Apache-2.0)  README.md  CONTRIBUTING.md  CODE_OF_CONDUCT.md  SECURITY.md
└── site/                         # Next.js app repurposed: docs site + interactive playground
```

## 2. Core Mechanics

### Single Source of Truth + Generated Adapters
`.ai/` plus the dot-directories are canonical. `CLAUDE.md`, `AGENTS.md`, `opencode.json`, `.github/copilot-instructions.md`, and BMAD files are **generated** by `.tools/adapter-sync` and verified in CI (drift = build failure). Editing an adapter directly is rejected by CI.

### One-Command Experience
```bash
git clone <repo> && cd ai-workflow-platform
# Then in ANY supported agent:
/discover            # agents pick this up natively via their adapter
# Or for humans:
npx awp init         # interactive setup: pick platform, verify adapters, open walkthrough
```

### Boot Sequence (every agent session)
1. Load constitution (`.ai/constitution.md`) — always in context via adapter.
2. Read `.memory/index.yaml` → hydrate relevant memory tiers.
3. Read `.ai/manifest.yaml` → discover commands, skills, templates.
4. Resolve active project from `.specs/` → determine current stage → suggest next command.

### Enforcement Stack (defense in depth)
| Layer | Mechanism | Platforms |
|-------|-----------|----------|
| L1 Persona | Gate preconditions in agent instructions | All |
| L2 Tooling | Pre-write hooks / permission scopes | Claude Code, OpenCode |
| L3 CI | `gate-validation.yml` blocks merges lacking approvals | All |
| L4 Branch protection | Required checks + CODEOWNERS on `.governance/`, `.ai/` | All |

## 3. Migration Map (current → target)

| Current | Target |
|---------|--------|
| `docs/architecture/` | `.docs/architecture/` (unchanged content) |
| `docs/ai-delivery-os/` | `.docs/ai-delivery-os/` + materialized into dot-dirs |
| `docs/architecture/test-scenarios/login-page/` | `.examples/login-page/` (flagship) |
| `app/`, `components/`, `lib/` | `site/` (docs + playground) |
