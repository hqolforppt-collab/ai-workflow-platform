<!-- GENERATED FILE — do not edit by hand. Source: .ai/manifest.yaml. Regenerate: npm run sync-adapters -->

# AI Workflow Platform — GitHub Copilot Adapter

This repository is a **Spec-Driven Development operating system** for AI-assisted workflow engineering and Flowable model generation.

## Bootstrap (do this first)

1. Read `.ai/constitution.md` — it is the **supreme authority**. Nothing you do may contradict it.
2. Read `.ai/manifest.yaml` for the component registries.
3. Read `.commands/DISCOVERY.md` for the command set, then follow `/awp-init` semantics: load agents, gates, templates, memory.

## Non-negotiable rules

- **Specification before implementation** — never generate models or code unless gates G1 (Requirements), G2 (Architecture), G3 (Data Model), and G4 (Security) are approved. Check `.governance/gates/`.
- **Humans approve gates, never agents** — no agent or assistant may self-approve a gate (Constitution R1).
- **Template-first generation** — every generated artifact must start from a template registered in `.templates/registry.yaml`.
- **Traceability** — every artifact carries a `trace:`/`source:` block linking back to its requirement (Constitution R4).
- **No secrets** — never write credentials or API keys into OS artifacts (Constitution C5).

## Flagship command

`/workflow-builder <story>` — turns a one-line user story into a complete enterprise-grade workflow blueprint
(28 sections, hidden-requirement discovery across 25+ domains, maturity levels L1–L6).
Prompt adapter: `.github/prompts/workflow-builder.prompt.md`. Canonical source: `.commands/workflow-builder/prompt.md`.

## Command set

`/awp-init` · `/workflow-builder` · `/discover` · `/specify` · `/architect` · `/generate` · `/gate G1..G5` ·
`/validate-spec` · `/lint-gates` · `/audit-trace` · `/memory-sync` · `/adapter-sync`

Full registry: `.commands/registry.yaml`. CLI equivalents: `awp <command>` via `packages/awp-cli`.
