# AI Workflow Platform

**Type one line. Get the enterprise spec you forgot to write.**

```
/workflow-builder Create Login and Registration Feature
```

```
Domains activated:     27 (2 explicit, 25 hidden)
Hidden requirements:   10 added across 10 domains
Validation:            26/26 rules passed
Assumptions to review: 6
Written:               blueprints/login-and-registration/ (6 staged files)
```

You asked for login. You got password policy, account lockout, rate limiting, fraud
detection, audit trail, GDPR privacy, SOC2 compliance, logging, monitoring, backup,
disaster recovery, runbooks, SLOs, and 12 more domains — every attribute concrete,
every failure path defined, every discovered item traced to the rule that added it.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Spec-Driven](https://img.shields.io/badge/method-spec--driven-green.svg)](.ai/constitution.md)
[![Domains: 70](https://img.shields.io/badge/knowledge_base-70_domains_%2F_9_packs-orange.svg)](.memory/domain-knowledge/index.yaml)
[![Repository OS](https://github.com/hqolforppt-collab/ai-workflow-platform/actions/workflows/validate.yml/badge.svg)](.github/workflows/validate.yml)
[![BPMN round-trip](https://github.com/hqolforppt-collab/ai-workflow-platform/actions/workflows/bpmn-roundtrip.yml/badge.svg)](.github/workflows/bpmn-roundtrip.yml)

## Install in 60 seconds

```bash
git clone https://github.com/hqolforppt-collab/ai-workflow-platform.git
cd ai-workflow-platform
```

Then open the repo in your tool — the command is already installed:

| Tool | It just works because | Run it |
|------|----------------------|--------|
| **Claude Code** | [`.claude/commands/workflow-builder.md`](.claude/commands/workflow-builder.md) | `/workflow-builder <story>` |
| **OpenCode** | [`.opencode/command/workflow-builder.md`](.opencode/command/workflow-builder.md) | `/workflow-builder <story>` |
| **Cursor** | [`.cursor/commands/workflow-builder.md`](.cursor/commands/workflow-builder.md) | `/workflow-builder <story>` |
| **GitHub Copilot** | [`.github/prompts/workflow-builder.prompt.md`](.github/prompts/workflow-builder.prompt.md) | `/workflow-builder` in chat |
| **Codex** | [`AGENTS.md`](AGENTS.md) (Flagship section) | ask for `/workflow-builder <story>` |
| **Gemini CLI** | [`AGENTS.md`](AGENTS.md) (Flagship section) | ask for `/workflow-builder <story>` |

No build step. No API keys. No configuration. The "install" is `git clone`.

## See it before you run it

The full golden example lives at
[`examples/workflow-builder/login-registration/`](examples/workflow-builder/login-registration/):
the one-line story above, expanded into a [640-line L6 blueprint](examples/workflow-builder/login-registration/blueprint.yaml)
with all 28 sections, plus the [12 golden tests](examples/workflow-builder/login-registration/golden-tests.yaml)
any implementation must pass.

## How it works

1. **Parse** your story — intent, actors, constraints, and negations ("passwordless" is honoured, not overridden).
2. **Discover** what you forgot — a [70-domain, 9-pack knowledge base](.memory/domain-knowledge/index.yaml) (auth, payments, approvals, documents, HR, commerce, data, integration, scheduling) with trigger keywords and an implication map, closed to a fixpoint by the [hidden-requirement-discovery skill](.skills/hidden-requirement-discovery/skill.yaml) and the deterministic [`awp classify`](packages/awp-cli/src/classify.js) engine.
3. **Resolve** constraints with precedence: your story > compliance > security > defaults.
4. **Populate** the [28-section blueprint schema](.schemas/workflow-blueprint/schema.yaml) — failures defined, IDs everywhere, no placeholders.
5. **Validate** against [17 machine-checkable rules](.schemas/workflow-blueprint/validation-rules.yaml) — broken output is never emitted silently.

Pick your depth with [maturity levels](.commands/workflow-builder/maturity-levels.yaml)
`L1` (sketch) to `L6` (enterprise, default): `/workflow-builder --level=L3 <story>`.

## CLI (`awp`) — execute, validate, deploy

The command works inline in any AI tool, but the `awp` CLI runs the same pipeline
end-to-end and adds deterministic validation and Flowable deployment:

```bash
awp classify "Create Login and Registration"                   # deterministic domain discovery (which packs fire, and why)
awp build "Create Login and Registration" --execute --staged   # 6 staged YAML files, [STAGE n/6] progress
awp build --aggregate blueprints/<slug>/                        # merge staged files → one blueprint.yaml
awp validate blueprints/<slug>/                                 # deterministic 26-rule engine (exit != 0 on failure)
awp review   blueprints/<slug>/                                 # advisory: constraint coverage + graded rubric (never gates)
awp flowable convert blueprints/<slug>/                         # → BPMN 2.0 / CMMN / DMN / Form JSON
awp flowable deploy  blueprints/<slug>/                         # gate-checked (G1–G4) deploy to a Flowable engine
awp validate --kb                                              # knowledge-base graph integrity (70 domains, 9 packs)
awp kb build-index [--check]                                    # regenerate / drift-check the KB index
awp schema check                                               # blueprint schema parses + summary in sync
```

- **Model tiers** ([`tiers.yaml`](.commands/workflow-builder/tiers.yaml)) route cheap models
  (Haiku/GPT-3.5 for L1–L3) vs. capable models (Sonnet/Opus for L4–L6); config lives in a
  git-ignored `.awp/config.yaml` (see [`.awp.config.example.yaml`](.awp.config.example.yaml)) that
  holds env-var **names**, never secrets.
- **Governance is fail-closed**: `awp flowable deploy` and the mutating
  [Flowable MCP tools](packages/flowable-mcp-server/README.md) refuse unless G1–G4 are
  approved for the blueprint (Constitution R2), via the shared
  [`@awp/governance`](packages/awp-governance/) module.
- **`.mcp.json`** registers the Flowable MCP server so Claude Code and other MCP clients
  can validate and deploy blueprints as tools.

## Guarantees

- **Additive-only** — your intent is never removed or contradicted.
- **No silent gaps** — every skipped domain carries a reason.
- **Traceability** — 100% of discovered content cites its discovery rule.
- **Actionability** — concrete numbers, durations, and limits. No TBDs.

## More than one command

`/workflow-builder` is the front door of a full spec-driven delivery OS: 6 agent
charters, 5 human approval gates, versioned skills with golden tests, a template
registry, and a 7-tier organizational memory — all governed by a
[repository constitution](.ai/constitution.md).

```
/awp-init   /discover   /specify   /architect   /generate   /gate G1..G5   /audit-trace
```

Full command set: [`.commands/registry.yaml`](.commands/registry.yaml) ·
Architecture: [`docs/architecture/00-index.md`](docs/architecture/00-index.md) ·
Operating model: [`docs/ai-delivery-os/00-index.md`](docs/ai-delivery-os/00-index.md)

## Launch checklist

Maintainers: the v1.0 launch checklist lives at [`docs/planning/LAUNCH_CHECKLIST.md`](docs/planning/LAUNCH_CHECKLIST.md).

## Contributing

First contribution in 15 minutes — start with [CONTRIBUTING.md](CONTRIBUTING.md).
The easiest high-impact PR: add a domain file to
[`.memory/domain-knowledge/`](.memory/domain-knowledge/index.yaml) (payments, search,
file-upload, multi-tenancy...) and wire it into the trigger map.

## License

[Apache-2.0](LICENSE)
