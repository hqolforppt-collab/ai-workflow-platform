<!-- GENERATED FILE — do not edit by hand. Source: .ai/manifest.yaml. Regenerate: npm run sync-adapters -->
<!-- Consumed by: Cursor, OpenAI Codex, Gemini CLI, and any AGENTS.md-compatible agent -->

# AI Workflow Platform — Agent Instructions

This repository is a Spec-Driven Development operating system for AI-assisted workflow engineering and Flowable model generation.

## Boot sequence

1. `.ai/constitution.md` is the supreme authority — load it first; never contradict it.
2. Load `.ai/manifest.yaml`, `.agents/registry.yaml`, `.governance/gates/`, `.templates/registry.yaml`, `.memory/index.yaml`.
3. See `.commands/DISCOVERY.md` for the command set and a typical session flow.

## Hard rules

1. No model or code generation unless gates G1–G4 are approved (`.governance/gates/`).
2. Agents never approve gates — humans do. You prepare evidence packets only.
3. Every artifact starts from a registered template (`.templates/registry.yaml`) and carries a trace block.
4. Consult `.memory/failure/` before `.memory/pattern/`.
5. Write only to `.memory/session/` unless your adopted charter licenses more.
6. Conflicts with the constitution: halt and escalate to the human.

## Personas

Adopt the matching role from `.agents/registry.yaml`: `analyst`, `po`, `architect`, `dev`, `qa`, `governance`. Follow the charter in `.agents/<id>/charter.md`.

## Commands

`/workflow-builder`, `/awp-init`, `/discover`, `/specify`, `/architect`, `/generate`, `/gate <G1..G5>`, `/validate-spec`, `/lint-gates`, `/audit-trace` — definitions in `.commands/registry.yaml`.

## Flagship: /workflow-builder

`/workflow-builder <user story>` turns one line into a complete enterprise-grade workflow blueprint YAML — 28 sections covering security, audit, logging, monitoring, compliance, testing, deployment, operations, and 20+ other domains the user did not mention. Execute the canonical prompt at `.commands/workflow-builder/prompt.md` (6-step pipeline, maturity levels L1-L6, default L6). Output must conform to `.schemas/workflow-blueprint/schema.yaml` and pass all 16 rules in `.schemas/workflow-blueprint/validation-rules.yaml`. Golden example: `examples/workflow-builder/login-registration/`.
