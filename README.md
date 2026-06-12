# AI Workflow Platform

**The open-source operating system for Spec-Driven Development, Workflow Engineering, and Agentic Software Delivery — with first-class Flowable (BPMN / CMMN / DMN) model generation.**

Clone it, open it in any AI coding agent, and it boots into a governed, spec-first delivery system. No setup, no lock-in.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Spec-Driven](https://img.shields.io/badge/method-spec--driven-green.svg)](.ai/constitution.md)
[![Agents: 6](https://img.shields.io/badge/agents-6-orange.svg)](.agents/registry.yaml)

## Why this exists

AI coding agents are fast — and ungoverned. This repository turns any AI agent (Claude Code, OpenCode, GitHub Copilot, Cursor, Codex, Gemini CLI, BMAD) into a **disciplined delivery team**:

- **Specification before implementation** — no code or model generation until requirements, architecture, data model, and security are human-approved.
- **Five mandatory human gates** — agents prepare evidence; humans decide. Always.
- **Full traceability** — Requirement → Design → Architecture → Task → Code → Test, enforced at every gate.
- **Template-first generation** — every artifact starts from a registered, versioned schema.
- **Organizational memory** — a 7-tier memory system so no learning is lost between projects.

## Quick start

```bash
git clone https://github.com/hqolforppt-collab/ai-workflow-platform.git
cd ai-workflow-platform
```

Then open the repo in your AI agent of choice — each one auto-discovers its adapter:

| Agent | Adapter (generated) |
|-------|---------------------|
| Claude Code | [`CLAUDE.md`](CLAUDE.md) |
| OpenCode | [`opencode.json`](opencode.json) |
| GitHub Copilot | [`.github/copilot-instructions.md`](.github/copilot-instructions.md) |
| Cursor / Codex / Gemini CLI | [`AGENTS.md`](AGENTS.md) |
| BMAD | [`.ai/adapters/bmad/`](.ai/adapters/bmad/agent-teams.yaml) |

Start a session:

```
/awp-init
/discover "build a leave request approval app"
/specify          → /gate G1   (human approves requirements)
/architect        → /gate G2-G4
/generate         → Flowable BPMN/CMMN/DMN models, fully traced
/audit-trace      → /gate G5   (release)
```

## How it works

```
.ai/constitution.md          ← supreme authority (5 principles, 7 rules)
  ├── .governance/gates/     ← G1–G5 human approval gates
  ├── .agents/               ← 6 agent charters (analyst, po, architect, dev, qa, governance)
  ├── .skills/               ← versioned capabilities with golden tests
  ├── .templates/            ← artifact schemas (template-first generation)
  ├── .memory/               ← 7-tier organizational memory
  └── .commands/             ← canonical command set + agent discovery
```

One tool-neutral core; thin generated adapters per platform. Adapters are regenerated from `.ai/manifest.yaml` (`npm run sync-adapters`) — hand edits are rejected by CI.

## Documentation

- [Architecture](docs/architecture/00-index.md) — AI-driven Flowable model generation
- [AI Delivery OS (AIDOS)](docs/ai-delivery-os/00-index.md) — the enterprise operating model
- [OSS Transformation](docs/oss-transformation/00-index.md) — assessments, blueprints, and roadmaps
- [Repository Constitution](.ai/constitution.md) — the rules everything obeys

## Contributing

We aim for your **first contribution in 15 minutes**. Start with [CONTRIBUTING.md](CONTRIBUTING.md). All contributions follow the same spec-driven flow the platform itself enforces.

## License

[Apache-2.0](LICENSE)
