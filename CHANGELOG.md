# Changelog

All notable changes to the AI Workflow Platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] — 2026-07-04

Gap-remediation release closing the audit of the v2.0 `/workflow-builder` plan
(`.hermes/reports/2026-07-04-v2-gap-report.md`). All items are additive; no
existing path moved.

### Added
- **`@awp/governance`** — shared, fail-closed G1–G4 gate module imported by both
  the CLI (`awp flowable deploy`) and the Flowable MCP server, so no mutating path
  can bypass governance (Constitution R2). Missing/unapproved gate records now
  refuse deployment instead of warning.
- **Governance on MCP tools** — `deploy`, `start_process`, `complete_task` now
  gate-check via `@awp/governance`; `deploy` refuses without a resolvable
  `blueprint_id`. Runtime mutation requires an approved blueprint or an explicit
  `AWP_ALLOW_RUNTIME_MUTATION=1` escape hatch.
- **`.mcp.json`** — tracked registration so the Flowable MCP server is discoverable
  by Claude Code and other MCP clients; server split into `client.js` + `index.js`
  with `packages/flowable-mcp-server/README.md`.
- **`awp validate <blueprint-dir|blueprint.yaml>`** — the deterministic 17-rule
  engine is now a CLI command (was only reachable inside `build --execute`).
- **Test harness** — `node:test` suites for governance, CLI (aggregate, validate,
  tiers, stages, schema-summary sync), and the MCP client; a `mock` model provider
  for keyless CI end-to-end runs; wired into both CI workflows.
- **Staged golden example** — `examples/workflow-builder/login-registration/`
  now ships the 6 staged files, the aggregated `blueprint.yaml`, and converted
  `flowable/` artifacts; passes `awp validate` 17/17.
- **`mcp:` delegation blocks** on the five modeling skills; `.awp.config.example.yaml`
  config template; `zod` added to `awp-cli`.

### Fixed
- **`awp build --aggregate`** no longer crashes (`require` in an ESM module) and now
  performs a real section union with root+dependent workflow merge and id-collision
  refusal, emitting a single-document `blueprint.yaml`.
- **Staged workflow merge** — reading staged files no longer lets stage-05 clobber
  the stage-04 root workflow (affected the validator, the converter, and aggregation).
- **`awp flowable convert`** uses per-model keys (never a generic `root`) and emits
  root + dependent BPMN, DMN, and forms — 6 artifacts for the golden example (was 1).
- **VAL-013** matches mandatory domains by normalized id-or-name (previously could
  never pass); **VAL-032** is a real dangling-reference check; **VAL-040** is labeled
  informational rather than a silent pass.
- **`model.js`** retries transient (429/5xx/network) failures with bounded backoff.
- Rule count corrected to **17** across prompt, pipeline, command, maturity, and
  adapter docs (was inconsistently "16").

## [1.0.0-ossp] — 2026-06-12

**Open Source Standard Platform Release** — The definitive open-source standard for Spec-Driven Development, Workflow Engineering, and AI-Native Enterprise Architecture.

### Added

#### Core Authority & Governance
- `.ai/constitution.md` — Constitutional rules and authority hierarchy
- `.ai/manifest.yaml` — Central registry of all system components (agents, skills, templates, commands)
- `.governance/` — 5-tier governance gates (G1–G5) with assignments, transitions, and enforcement
- Agent architecture: 6 agents (Analyst, PO, Architect, Dev, QA, Governance) with charters

#### Registries & Artifacts
- **Skills Registry** (20 approved skills)
  - Core: BPMN modeling, root model selection, requirements elicitation, trace audit
  - Architecture: DDD analysis, API design, ADR writing, threat modeling
  - Quality: test strategy, golden tests, security reviews (OWASP)
  - Governance: gate evidence, architecture docs, schema design, migration planning
  - Golden tests for all skills (100% passing)

- **Templates Registry** (12 approved templates)
  - Requirements: business-requirement, functional-requirement, user-story
  - Architecture: architecture-spec, ADR, adr
  - Flowable: BPMN process, form-definition, CMMN case, DMN decision
  - Data: data-dictionary
  - Security: threat-model
  - Testing: test-strategy

- **Commands Registry** (11 approved commands)
  - `awp discover` — Scan repo for skills, templates, models, agents
  - `awp specify` — Requirements elicitation with templates
  - `awp architect` — Architecture design + ADR generation
  - `awp generate` — Transform specs into BPMN, forms, migrations
  - `awp gate` — Governance gate evidence collection and approval
  - `awp validate-spec` — Spec validation against constitutional rules
  - `awp lint-gates` — Gate consistency verification
  - `awp audit-trace` — Full traceability chain (req → spec → design → code → test)
  - `awp adapter-sync` — Synchronize platform adapters (CLAUDE.md, opencode.json, etc.)
  - `awp memory-sync` — Populate memory tiers from logs

#### Platform Adapters
- `CLAUDE.md` — Claude Code adapter with agent definitions, commands, system prompts
- `AGENTS.md` — Detailed agent team definitions and workflows
- `opencode.json` — OpenCode/GitHub Copilot configuration
- `.github/copilot-instructions.md` — Copilot system instructions
- `.ai/adapters/bmad/agent-teams.yaml` — BMAD agent orchestration

#### Memory System
- 7-tier memory architecture: Strategic, Domain, Pattern, Decision, Project, Session, Failure
- Memory scaffold with registries and cross-linking
- `.memory/strategic/README.md` — Strategic context templates

#### Workflows
- `.workflows/greenfield-flowable.yaml` — New project initialization workflow
- `.workflows/brownfield-flowable.yaml` — Existing codebase migration workflow

#### Validation Tooling
- `.tools/validate-spec.sh` — Specification format and rule validation
- `.tools/validate-gates.sh` — Gate consistency and completeness checks
- `.tools/trace-audit.sh` — Requirement traceability verification
- `.tools/adapter-sync.sh` — Platform adapter drift detection
- `.tools/memory-sync.sh` — Memory tier synchronization
- `.ci/workflows/validate.yml` — CI pipeline (staged for manual activation)

#### OSS Infrastructure
- `LICENSE` (Apache-2.0) — Open source license
- `README.md` — Project overview, quick start, 5,000-star vision
- `CONTRIBUTING.md` — Contribution guidelines, code of conduct, development setup
- `CODE_OF_CONDUCT.md` — Community values and enforcement policy
- `SECURITY.md` — Security policy and vulnerability reporting
- `CHANGELOG.md` — Release notes and version history
- `ROADMAP.md` — Feature roadmap (100★ → 1K★ → 5K★)
- `.github/ISSUE_TEMPLATE/bug-report.yaml` — Bug report issue template
- `.github/ISSUE_TEMPLATE/feature-request.yaml` — Feature request issue template
- `.github/PULL_REQUEST_TEMPLATE.md` — Pull request template

#### Flagship Example
- `examples/login-page/` — Complete production-ready login system
  - Requirements: REQ-LOGIN-001, SPEC-LOGIN-001
  - Architecture: ADR-001 (JWT + HttpOnly), BPMN, threat model
  - Implementation: Express handler with bcrypt, JWT, rate limiting, audit logging
  - Tests: 5 golden tests (happy path, invalid creds, rate limiting, session validation, security)
  - Gates: G2 & G4 approvals with full evidence
  - Documentation: README with 15-minute quickstart

### Fixed

- N/A (initial release)

### Deprecated

- N/A (initial release)

### Removed

- N/A (initial release)

### Security

- HTTPS required for all APIs (TLS 1.2+)
- Password hashing: bcrypt with 12+ rounds
- Session tokens: JWT HS256 with 24-hour expiry
- Rate limiting: 5-attempt brute-force protection per IP
- Input validation: email format, length constraints, regex patterns
- Audit logging: all login attempts logged with IP and user-agent
- OWASP Top 10 compliance verified (A01–A07)

---

## [0.2.0] — 2026-06-06

### Added
- Materialization blueprint with 8 executable outputs
- Compliance assessments for BMAD, Claude Code, OpenCode, GitHub Copilot

---

## [0.1.0] — 2026-05-15

### Added
- Initial architecture documentation (Flowable modeling, AIDOS)
- Foundational skill and template definitions

---

**Links:**
- [GitHub Repository](https://github.com/hqolforppt-collab/ai-workflow-platform)
- [Documentation](docs/)
- [Roadmap](ROADMAP.md)
