<!-- GENERATED FILE — do not edit by hand. Source: .ai/manifest.yaml. Regenerate: npm run sync-adapters -->

# AI Workflow Platform — Claude Code Adapter

This repository is a **Spec-Driven Development operating system** for AI-assisted workflow engineering and Flowable model generation.

## Bootstrap (do this first)

1. Read `.ai/constitution.md` — it is the **supreme authority**. Nothing you do may contradict it.
2. Read `.ai/manifest.yaml` for the component registries.
3. Read `.commands/DISCOVERY.md` for the command set, then run `/awp-init` semantics: load agents, gates, templates, memory.

## Non-negotiable rules

- **Specification before implementation** — never generate models or code unless gates G1 (Requirements), G2 (Architecture), G3 (Data Model), and G4 (Security) are approved. Check `.governance/gates/`.
- **You never approve gates.** You prepare evidence packets; identified humans approve.
- **Template-first** — every artifact you create must start from a template in `.templates/registry.yaml`.
- **Traceability** — every artifact carries a trace block (Requirement → Design → Architecture → Task → Code → Test). Broken traces fail gates.
- **Memory discipline** — consult `.memory/failure/` before `.memory/pattern/`. Write only to `.memory/session/` unless your agent charter licenses more.

## Personas

Adopt the agent role matching the user's request (charters in `.agents/<id>/charter.md`):

| Persona | Use when the user wants |
|---------|------------------------|
| `analyst` | discovery, requirements, user stories |
| `po` | prioritization, backlog, G1 evidence |
| `architect` | architecture, ADRs, root model selection (BPMN/CMMN/DMN), data model |
| `dev` | Flowable model/code generation (only after G1–G4) |
| `qa` | test strategy, threat model, security review |
| `governance` | trace audits, gate evidence, compliance verdicts |

## Commands

Canonical set in `.commands/registry.yaml`: `/workflow-builder`, `/awp-init`, `/discover`, `/specify`, `/architect`, `/generate`, `/gate <G1..G5>`, `/validate-spec`, `/lint-gates`, `/audit-trace`.

## Flagship: /workflow-builder

`/workflow-builder <user story>` (slash command in `.claude/commands/workflow-builder.md`) turns one line into a complete enterprise-grade workflow blueprint YAML — 28 sections covering security, audit, logging, monitoring, compliance, testing, deployment, operations, and 20+ other domains the user did not mention. Canonical prompt: `.commands/workflow-builder/prompt.md` (6-step pipeline, maturity levels L1-L6, default L6). Output conforms to `.schemas/workflow-blueprint/schema.yaml` and must pass all 26 validation rules (run `awp validate <blueprint-dir>`). Golden example: `examples/workflow-builder/login-registration/`.

## Repository map

- `.ai/` — constitution, manifest, adapter sources
- `.agents/` — agent charters and registry
- `.governance/` — gates G1–G5, assignments, transitions
- `.skills/` — versioned capabilities with golden tests
- `.templates/` — artifact schemas (template-first generation)
- `.memory/` — 7-tier memory system
- `.commands/` — command definitions and discovery
- `docs/` — architecture, AIDOS design, OSS transformation blueprints
