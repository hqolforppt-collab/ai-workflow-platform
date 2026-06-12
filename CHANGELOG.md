# Changelog

All notable changes to the AI Workflow Platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
