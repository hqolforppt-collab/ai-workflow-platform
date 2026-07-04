# Enhanced /workflow-builder Architecture Plan

> **For Hermes:** Read-only plan — pure documentation deliverable. No code execution.
> **Goal:** Redesign /workflow-builder to support one-command Claude Code execution, staged
>   YAML delivery (6 stages), Flowable MCP integration, cheap-model compatibility, and
>   improved UX — all within a single `awp build --execute` invocation.
> **Based on:** Review of 2026-07-04_120000-architecture-review-workflow-builder.md
> **Date:** 2026-07-04

---

## Executive Summary

The current /workflow-builder command is spec-strong but execution-weak: a 6-step pipeline
defined in YAML that only the LLM executes, producing one monolithic 28-section YAML. This
plan redesigns the output model to 6 staged files, introduces a programmatic pipeline engine
that orchestrates multiple LLM calls (cheap for early stages, capable for later ones),
exposes Flowable via MCP for one-command deploy, and wraps everything in a single
`awp build --execute` CLI invocation usable directly from Claude Code.

**Key architectural decisions:**

1. **Split the pipeline into a programmatic engine + LLM workers.** The pipeline itself
   becomes code (deterministic, testable). LLMs are called only where reasoning is needed.
2. **Output shifts from 1 monolithic file to 6 incremental files** matching the user's
   6 stages, with a 7th optional file holding the classic full 28-section blueprint for
   backward compatibility.
3. **Model-tier routing** sends cheap/fast models to early stages (parsing, classification)
   and capable models to late stages (schema population, validation).
4. **Flowable MCP server** accepts staged YAML and deploys to a running Flowable engine
   — the terminal stage of `/workflow-builder --execute --deploy`.

---

## Architecture Overview

```
User: /workflow-builder "Create Login Feature" --execute [--deploy]
            │
            ▼
┌───────────────────────────────────────────────────────────────────┐
│  awp build --execute                                              │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Pipeline Engine (packages/awp-cli/src/pipeline/engine.js)  │  │
│  │                                                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │ Stage 1  │─▶│ Stage 2  │─▶│ Stage 3  │─▶│  ...     │   │  │
│  │  │ (cheap)  │  │ (cheap)  │  │ (medium) │  │          │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  │       │              │              │              │        │  │
│  │       ▼              ▼              ▼              ▼        │  │
│  │  01-initialized  02-in-progress  03-app.yaml  04-root...   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────┐  ┌────────────────────────────────┐    │
│  │  Model Router        │  │  Flowable MCP Client           │    │
│  │  (--model-tier flag) │  │  (--deploy flag)               │    │
│  │  cheap→small LLM     │  │  Deploy staged YAML → Flowable │    │
│  │  medium→mid LLM      │  │  REST API via MCP tools        │    │
│  │  full→capable LLM    │  └────────────────────────────────┘    │
│  └──────────────────────┘                                        │
└───────────────────────────────────────────────────────────────────┘
```

---

## Output Model: 6 Staged Files + 1 Legacy

The monolithic 28-section YAML is replaced by 6 incremental files. Each stage writes its
own file with clear dependencies. Stage N+1 references Stage N. A 7th file,
`07-full-blueprint.yaml`, is produced only at L6 for backward compatibility.

```
blueprints/<slug>/
├── 01-initialized.yaml        # Stage 1 output
├── 02-in-progress.yaml        # Stage 2 output (extends 01)
├── 03-app.yaml                # Stage 3: Generating App
├── 04-root-models.yaml        # Stage 4: Generating Root Models
├── 05-dependent-models.yaml   # Stage 5: Generating Dependent Models
├── 06-forms.yaml              # Stage 6: Generating Forms
└── 07-full-blueprint.yaml     # (optional, L6 only) full 28-section legacy format
```

### File 01: initialized.yaml

```yaml
stage: Initialized
blueprint_id: BLU-LOGIN-REG-001
story: "Create Login and Registration Feature"   # verbatim
parsed:
  intent: "User authentication system with registration"
  actors: [unauthenticated-user, registered-user, admin]
  capabilities: [login, logout, register, password-reset]
  constraints: ["no email verification in v1"]
  negations: ["passwordless login"]             # user override
maturity_level: L6
model_tier: full
domains_classified:
  explicit: [authentication, registration]
  implicit_closure_pending: true
timestamp: 2026-07-04T12:00:00Z
```

### File 02: in-progress.yaml

```yaml
stage: In Progress
extends: 01-initialized.yaml
domains:
  functional:
    - {id: DOM-AUTH, name: authentication, source: user}
    - {id: DOM-REG, name: registration, source: user}
  cross_cutting:
    - {id: DOM-SEC, name: security, source: discovery, rule: "discovery/any-user-facing.security"}
    - {id: DOM-AUDIT, name: audit, source: discovery, rule: "discovery/any-user-facing.audit"}
    # ... 12+ cross-cutting domains populated
  not_applicable:
    - {id: DOM-PWDLESS, name: passwordless-login, reason: "user negation 'passwordless login'"}
requirements:
  explicit: [...]     # from user story
  hidden: [...]       # from implication closure
  count: {explicit: 8, hidden: 42}
```

### File 03: app.yaml — Generating App

```yaml
stage: Generating App
extends: 02-in-progress.yaml
app:
  name: "Login & Registration"
  id: BLU-LOGIN-REG-001
  blueprint_schema_version: 2.0.0
  maturity_level: L6
  summary: "..."  # one paragraph with discovered scope
  scope: {in_scope: [...], out_of_scope: [...]}
  stakeholders: [...]
```

### File 04: root-models.yaml — Generating Root Models

```yaml
stage: Generating Root Models
extends: 03-app.yaml
depends_on: [03-app.yaml]
root_model:
  type: BPMN                           # or CMMN, per root-model-selection skill
  decision_rationale: "Sequential login flow → BPMN process"
  process_id: login-registration-process
  bpmn:
    # Inline BPMN XML or structured YAML representation
    # Generated by the bpmn-modeling skill
  data_dictionary:
    entities:
      - {name: User, fields: [{name: email, type: string, pii: true}, ...]}
      - {name: Session, fields: [...]}
  actors: [...]                         # all actors from schema
  roles: [...]                          # permission model
```

### File 05: dependent-models.yaml — Generating Dependent Models

```yaml
stage: Generating Dependent Models
extends: 04-root-models.yaml
depends_on: [04-root-models.yaml]
dependent_models:
  - {type: CMMN, id: account-recovery-case, parent_process: login-registration-process}
  - {type: DMN, id: risk-scoring-decision, input: login-attempt, output: risk-level}
  # Child models referencing root model
integrations: [...]                     # API, events, notifications
```

### File 06: forms.yaml — Generating Forms

```yaml
stage: Generating Forms
extends: 05-dependent-models.yaml
depends_on: [04-root-models.yaml, 05-dependent-models.yaml]
forms:
  - id: FORM-LOGIN-001
    name: "Login Form"
    associated_task: login-user-task    # references BPMN user task from root model
    fields:
      - {name: email, type: email, validation: "required|email", error_message: "Valid email required"}
      - {name: password, type: password, validation: "required|min:8", error_message: "Password must be 8+ characters"}
  - id: FORM-REG-001
    name: "Registration Form"
    associated_task: register-user-task
    fields: [...]
```

### File 07: full-blueprint.yaml (L6 only, optional)

The complete 28-section schema populated as today, for backward compatibility.
Generated only when `--format=full` is passed or maturity L6 is requested.

---

## 6-Stage Pipeline Engine

The pipeline becomes programmatic code — not just a prompt. Each stage is a function with
defined inputs, outputs, and model-tier requirements.

### Stage 1: Initialized → `01-initialized.yaml`

| Attribute | Value |
|-----------|-------|
| **Model tier** | cheap (GPT-3.5 / Claude Haiku / Llama 3 8B) |
| **Input** | User story string + `--level` + `--context` flags |
| **LLM call** | Single call: parse story, classify domains |
| **Prompt size** | ~500 tokens (compact parse prompt, no schema) |
| **Output** | `01-initialized.yaml` |
| **Code path** | `packages/awp-cli/src/pipeline/stages/01-initialize.js`|

The prompt for Stage 1 is a slimmed-down version of the current parse-story +
classify-domains steps. No schema.yaml is sent — just the trigger-map from
domain-knowledge/index.yaml (which is ~200 tokens compressed).

### Stage 2: In Progress → `02-in-progress.yaml`

| Attribute | Value |
|-----------|-------|
| **Model tier** | cheap |
| **Input** | `01-initialized.yaml` |
| **LLM call** | Single call: expand-hidden (implication closure) |
| **Prompt size** | ~800 tokens (implication-map + negation rules + baseline) |
| **Output** | `02-in-progress.yaml` |
| **Code path** | `packages/awp-cli/src/pipeline/stages/02-expand-domains.js`|

The implication-map from domain-knowledge/ is sent. The LLM runs fixpoint closure.
Negations from Stage 1 are enforced.

### Stage 3: Generating App → `03-app.yaml`

| Attribute | Value |
|-----------|-------|
| **Model tier** | medium (GPT-4o-mini / Claude Sonnet / Qwen 2.5 32B) |
| **Input** | `02-in-progress.yaml` |
| **LLM call** | Single call: resolve constraints, populate project/scope sections |
| **Prompt size** | ~1,500 tokens (project section of schema + constraint resolution rules) |
| **Output** | `03-app.yaml` |
| **Code path** | `packages/awp-cli/src/pipeline/stages/03-generate-app.js`|

### Stage 4: Generating Root Models → `04-root-models.yaml`

| Attribute | Value |
|-----------|-------|
| **Model tier** | full (GPT-4o / Claude Opus / DeepSeek-V3) |
| **Input** | `03-app.yaml` + Flowable root-model-selection skill |
| **LLM call** | Single call: select root model type, generate BPMN/CMMN + data dictionary + actors + roles + workflows |
| **Prompt size** | ~3,000 tokens (root-model sections of schema + Flowable templates) |
| **Output** | `04-root-models.yaml` |
| **Code path** | `packages/awp-cli/src/pipeline/stages/04-generate-root-models.js`|

This is where the Flowable knowledge kicks in. The LLM receives:
- The root-model-selection skill (BPMN vs CMMN vs DMN decision logic)
- The bpmn-modeling or cmmn-modeling skill
- The data-dictionary template
- Schema sections: actors, roles, workflows, data-model

### Stage 5: Generating Dependent Models → `05-dependent-models.yaml`

| Attribute | Value |
|-----------|-------|
| **Model tier** | full |
| **Input** | `04-root-models.yaml` |
| **LLM call** | Single call: generate child models, integrations, events, API, notifications |
| **Prompt size** | ~2,500 tokens |
| **Output** | `05-dependent-models.yaml` |
| **Code path** | `packages/awp-cli/src/pipeline/stages/05-generate-dependent-models.js`|

### Stage 6: Generating Forms → `06-forms.yaml`

| Attribute | Value |
|-----------|-------|
| **Model tier** | medium or full |
| **Input** | `04-root-models.yaml` + `05-dependent-models.yaml` |
| **LLM call** | Single call: generate forms for all user tasks across root + dependent models |
| **Prompt size** | ~1,500 tokens (forms section of schema + form-modeling skill) |
| **Output** | `06-forms.yaml` |
| **Code path** | `packages/awp-cli/src/pipeline/stages/06-generate-forms.js`|

### Post-pipeline: Validation & Full Blueprint

After all 6 stages, the engine:

1. **Validates** each YAML file against the relevant subset of validation rules
   (programmatic validation, not LLM-dependent).
2. **Generates coverage report** (domains, hidden requirements, assumptions).
3. **Optionally produces `07-full-blueprint.yaml`** by merging all 6 files into the
   28-section schema format, then validating against all 16 rules.

---

## Model-Tier Routing

The `--model-tier` flag controls which models serve which stages:

```
--model-tier=full     → all stages use configured full model (default, backward compat)
--model-tier=medium   → cheap for S1-S2, medium for S3-S6
--model-tier=cheap    → cheap for S1-S2, medium for S3-S6, full only if needed
--model-tier=auto     → engine decides per stage based on complexity detection
```

### Tier definitions

| Tier | Example models | Context window | Use for |
|------|---------------|----------------|---------|
| cheap | GPT-3.5 Turbo, Claude Haiku, Llama 3 8B, Qwen 2.5 7B | 8K-16K | Stages 1-2 (parsing, classification) |
| medium | GPT-4o-mini, Claude Sonnet, Qwen 2.5 32B, DeepSeek-V2 | 32K-128K | Stages 3, 6 (app, forms) |
| full | GPT-4o, Claude Opus, DeepSeek-V3, Gemini Pro | 128K+ | Stages 4-5 (root models, dependent models) |

### Cheap-model optimizations

1. **Schema summarization:** Instead of sending the full 28-section schema (4,500 tokens),
   each stage receives ONLY the schema subset it needs (~500-1,500 tokens per stage).
2. **Incremental context:** Stage N receives Stage N-1's output as context, not the full
   history. Total context per call is bounded to ~3,000 tokens input.
3. **No monolithic prompt:** The 8,200-token assembled prompt is gone. Largest single
   prompt is ~3,000 tokens (Stage 4).
4. **Programmatic validation:** Validation (16 rules) runs as code, not as LLM reasoning.
   This saves ~2,000 tokens of validation-rule prompt and eliminates hallucination risk.
5. **Retry with upgrade:** If a cheap model fails validation on its stage output, the
   engine auto-retries with the next tier up.

### Total token comparison

| Scenario | Old (monolithic) | New (staged) |
|----------|-----------------|--------------|
| Input tokens (single call) | ~8,200 | ~500-3,000 per stage |
| Output tokens (total) | ~15,000 | ~12,000 across 6 files |
| Total calls | 1 (big model) | 6 (mix of cheap + full) |
| Minimum context needed | ~25K tokens | ~4K tokens (Stage 1 only) |
| Cheapest viable model | GPT-4-level (25K ctx) | GPT-3.5-level (4K ctx for S1-S2) |

---

## One-Command Claude Code Build

### CLI: `awp build --execute`

```bash
# Basic: generate staged blueprint
awp build --execute "Create Login Feature"

# With deploy to Flowable
awp build --execute --deploy "Create Login Feature"

# Cheap model, low maturity
awp build --execute --model-tier=cheap --level=L3 "Quick prototype"

# Brownfield: extend existing blueprint
awp build --execute --context=blueprints/existing/ "Add password reset"
```

The `--execute` flag is the single entry point. Without it, `awp build` retains its
current behaviour (assemble prompt only, for manual piping).

### Claude Code Integration

The existing `.claude/commands/workflow-builder.md` adapter is updated to call
`awp build --execute` when available:

```markdown
---
description: Turn a one-line user story into a complete enterprise-grade workflow blueprint
argument-hint: <user story> [--level=L1..L6] [--output=path] [--deploy]
---

Execute the /workflow-builder command:

$ARGUMENTS

1. If `awp build --execute` is available (packages/awp-cli installed), run:
   `awp build --execute $ARGUMENTS`

2. Fallback (no CLI): follow the canonical prompt at
   `.commands/workflow-builder/prompt.md`.
```

Alternatively, Claude Code can invoke it directly as a shell command:

```
> /workflow-builder Create Login Feature --deploy
```

Claude Code runs `awp build --execute "Create Login Feature" --deploy` and displays
the progress output (Stage 1/6 → 2/6 → ...) with file paths.

### Progress Output

The engine streams progress to stdout:

```
/workflow-builder: Create Login Feature (L6, tier=full)
[1/6] Initialized       → blueprints/login-reg/01-initialized.yaml      (0.8s, cheap)
[2/6] In Progress       → blueprints/login-reg/02-in-progress.yaml      (1.2s, cheap)
[3/6] Generating App    → blueprints/login-reg/03-app.yaml              (2.1s, medium)
[4/6] Root Models       → blueprints/login-reg/04-root-models.yaml      (4.5s, full)
[5/6] Dependent Models  → blueprints/login-reg/05-dependent-models.yaml (3.8s, full)
[6/6] Generating Forms  → blueprints/login-reg/06-forms.yaml            (2.0s, medium)

Validation: 16/16 rules passed
Domains: 18 (3 explicit, 15 hidden), 2 not-applicable
Hidden requirements: 42 across 15 domains
Assumptions to review: 5 → section 'assumptions' in 04-root-models.yaml

✓ Done — 6 files in blueprints/login-reg/
```

---

## Flowable MCP Integration

### MCP Server: `flowable-mcp-server`

A standalone MCP server (Node.js package in `packages/flowable-mcp/`) that exposes
Flowable REST API as MCP tools:

```
packages/flowable-mcp/
├── package.json
├── src/
│   ├── index.js              # MCP server entry point (stdio transport)
│   ├── tools/
│   │   ├── deploy.js          # Deploy BPMN/CMMN/DMN to engine
│   │   ├── start-process.js   # Start a process instance
│   │   ├── complete-task.js   # Complete a user task
│   │   ├── query.js           # Query processes/tasks/history
│   │   ├── get-form.js        # Retrieve form definition
│   │   └── health.js          # Engine health check
│   └── client.js             # Flowable REST client (reused from scripts/)
```

### MCP Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `flowable_deploy` | Deploy a model to Flowable engine | `{model_type, xml_content, name}` | `{deployment_id, process_definitions[]}` |
| `flowable_start_process` | Start a process instance | `{process_key, variables, tenant_id?}` | `{process_instance_id}` |
| `flowable_complete_task` | Complete a user task | `{task_id, variables}` | `{completed: true}` |
| `flowable_query_tasks` | Query tasks by criteria | `{assignee?, process_instance_id?, status?}` | `{tasks: [...]}` |
| `flowable_query_processes` | Query process instances | `{process_key?, status?}` | `{processes: [...]}` |
| `flowable_get_form` | Get form definition for a task | `{task_id}` | `{form_definition}` |
| `flowable_health` | Check engine connectivity | `{}` | `{version, uptime, engine_status}` |

### Deploy Flow from `awp build --execute --deploy`

When `--deploy` is passed, after Stage 6 the engine:

1. Reads `04-root-models.yaml` and `05-dependent-models.yaml`
2. Converts BPMN/CMMN/DMN YAML → XML using the bpmn-roundtrip tool
3. Calls `flowable_deploy` via MCP for each model
4. Calls `flowable_get_form` to verify form definitions from `06-forms.yaml`
5. Reports deployment status

```
[deploy] Converting root BPMN model → XML...
[deploy] Deploying login-registration-process.bpmn20.xml → deployment id dep-001 ✓
[deploy] Deploying account-recovery-case.cmmn.xml → deployment id dep-002 ✓
[deploy] Deploying risk-scoring-decision.dmn.xml → deployment id dep-003 ✓
[deploy] Verifying 4 form definitions... ✓

✓ Deployed to Flowable at http://localhost:8080/flowable-rest
  Process definitions: login-registration-process (v1), account-recovery-case (v1)
```

### MCP Configuration for Claude Code

Users add to their Claude Code MCP config:

```json
{
  "mcpServers": {
    "flowable": {
      "command": "node",
      "args": ["packages/flowable-mcp/dist/index.js"],
      "env": {
        "FLOWABLE_URL": "http://localhost:8080/flowable-rest",
        "FLOWABLE_USER": "rest-admin",
        "FLOWABLE_PASS": "test"
      }
    }
  }
}
```

---

## Improved UX

### Problem → Solution map

| Current UX issue | Solution |
|-----------------|----------|
| Monolithic 1,240+ line YAML output | 6 incremental files, each 100-300 lines |
| No progress feedback | Real-time stage progress with timings |
| All-or-nothing failure | Per-stage validation; resume from last successful stage |
| Dense 90-line prompt incomprehensible to users | Users never see the prompt — they type one line |
| Manual pipe step | `--execute` flag makes it one command |
| No way to tweak intermediate output | Each stage file is human-editable; resume with `--from-stage=N` |

### New CLI flags

```
awp build --execute [story]

Flags:
  --level=L1..L6          Maturity level (default: L6)
  --model-tier=auto|cheap|medium|full   Model routing (default: auto)
  --output=path           Output directory (default: blueprints/<slug>/)
  --context=path          Brownfield: extend existing blueprint
  --deploy                Deploy to Flowable after generation
  --from-stage=N          Resume from stage N (1-6), using existing stage files
  --dry-run               Show what would run without making LLM calls
  --format=staged|full    Output format: staged (default) or full monolithic
```

### Error Recovery

If Stage 4 fails (e.g., model timeout), the user can:

```bash
# Fix the root model manually
vim blueprints/login-reg/04-root-models.yaml

# Resume from stage 4
awp build --execute --from-stage=4 "Create Login Feature"
```

The engine detects existing stage files, loads them, and continues from the specified stage.

### Format Flag

- `--format=staged` (default): produces the 6 incremental files
- `--format=full`: produces only `blueprints/<slug>.yaml` — the classic 28-section monolithic
  format, for consumers that expect the old shape

---

## File Changes Summary

### New files to create

```
packages/awp-cli/src/pipeline/
├── engine.js                       # Pipeline orchestrator
├── model-router.js                 # Tier-based model selection
├── validator.js                    # Programmatic 16-rule validator
├── stages/
│   ├── 01-initialize.js            # Parse story + classify domains
│   ├── 02-expand-domains.js        # Implication closure
│   ├── 03-generate-app.js          # App container
│   ├── 04-generate-root-models.js  # Root BPMN/CMMN + data dict
│   ├── 05-generate-dependent.js    # Child models + integrations
│   └── 06-generate-forms.js        # Form definitions
└── prompts/
    ├── stage-01-parse.md           # Compact parse prompt (~500 tokens)
    ├── stage-02-expand.md          # Compact expand prompt (~800 tokens)
    ├── stage-03-app.md             # App generation prompt
    ├── stage-04-root-models.md     # Root model generation prompt
    ├── stage-05-dependent.md       # Dependent model prompt
    └── stage-06-forms.md           # Forms prompt

packages/flowable-mcp/
├── package.json
├── src/
│   ├── index.js                    # MCP server (stdio)
│   ├── client.js                   # Flowable REST client
│   └── tools/
│       ├── deploy.js
│       ├── start-process.js
│       ├── complete-task.js
│       ├── query.js
│       ├── get-form.js
│       └── health.js

.schemas/workflow-blueprint/
└── staged-schema.yaml              # Schema subsets per stage (refactored from schema.yaml)

.hermes/plans/
└── 2026-07-04_124500-workflow-builder-enhanced-architecture.md  # This document
```

### Files to modify

```
packages/awp-cli/src/commands/build.js    # Add --execute, --deploy, --from-stage, --model-tier, --format flags
packages/awp-cli/src/index.js             # Wire new flags to CLI
package.json                               # Add flowable-mcp workspace, new deps
.claude/commands/workflow-builder.md       # Update adapter to call awp build --execute
```

### Files that remain (no changes needed)

```
.commands/workflow-builder/prompt.md       # Retained as fallback / reference
.commands/workflow-builder/pipeline.yaml   # Retained as spec reference
.commands/workflow-builder/maturity-levels.yaml  # No changes
.schemas/workflow-blueprint/schema.yaml    # No changes (still authoritative for full format)
.schemas/workflow-blueprint/validation-rules.yaml  # No changes
.ai/constitution.md                        # Supreme authority — no changes
.memory/domain-knowledge/index.yaml        # No changes
```

---

## Implementation Phases

### Phase 1: Pipeline Engine + Staged Output (P0)

- Build `packages/awp-cli/src/pipeline/engine.js` — the programmatic orchestrator
- Implement the 6 stage functions with their compact prompts
- Implement `--execute` flag in build command
- Produce the 6 staged YAML files
- Programmatic validation (16 rules as code)

**Deliverable:** `awp build --execute "story"` produces 6 files in `blueprints/<slug>/`

### Phase 2: Model-Tier Routing (P1)

- Build `model-router.js` with cheap/medium/full tier definitions
- Implement `--model-tier` flag
- Implement auto-retry with tier upgrade on validation failure
- Schema summarization per stage

**Deliverable:** `awp build --execute --model-tier=cheap "story"` works with GPT-3.5-level models

### Phase 3: Flowable MCP Server (P0)

- Build `packages/flowable-mcp/` MCP server
- Implement all 7 MCP tools
- Wire `--deploy` flag to call MCP tools after Stage 6
- YAML → XML conversion via bpmn-roundtrip

**Deliverable:** `awp build --execute --deploy "story"` deploys to Flowable

### Phase 4: Claude Code + UX Polish (P1)

- Update `.claude/commands/workflow-builder.md` adapter
- Add progress output formatting
- Add `--from-stage=N` resume support
- Add `--dry-run` flag
- Add `--format=staged|full` flag
- Update other adapters (OpenCode, Cursor, Copilot)

**Deliverable:** `/workflow-builder "story"` in Claude Code runs the full pipeline

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Staged output breaks existing consumers of monolithic YAML | Medium | High | `--format=full` flag preserves backward compat; `07-full-blueprint.yaml` generated at L6 |
| Flowable MCP requires running Flowable engine (not always available) | Medium | Medium | `--deploy` is opt-in; MCP server health-checks before deploy; graceful degradation |
| Cheap models still hallucinate on schema subsets | Low | Medium | Per-stage programmatic validation catches errors; auto-retry with tier upgrade |
| Splitting pipeline into 6 calls increases latency | Low | High | Cheap stages (1-2) complete in <2s; parallel where possible; total time comparable to one large call |
| Pipeline engine is Node.js only (loses cross-platform YAML spec advantage) | Low | Low | Pipeline spec remains in YAML; engine is one implementation; other runtimes can implement same spec |
| Flowable MCP server is a separate process (deployment complexity) | Medium | Medium | Packaged as npm workspace; one `npm install` + config; CI tested with Docker Flowable |

---

## Open Questions

1. **Model configuration:** Should model endpoints be configured in `.ai/manifest.yaml` under a new `models:` section, or via environment variables (`AWP_MODEL_CHEAP`, `AWP_MODEL_FULL`)?
2. **Stage 4 BPMN generation:** Should the LLM produce BPMN XML directly, or produce structured YAML that is deterministically converted to XML? (YAML → XML is safer; XML directly leverages LLM's XML-generation ability but risks malformed output.)
3. **MCP transport:** Should the Flowable MCP server use stdio transport (same process, simpler) or HTTP/SSE transport (separate process, more flexible)?
4. **Validation engine language:** The validator could be a standalone YAML validation script (Node.js or Python) or embedded in the pipeline engine. Node.js keeps the tech stack uniform (everything in pnpm workspace).
5. **Resume mechanism:** Should `--from-stage=N` require ALL prior stage files to exist, or only the immediate dependency? (Recommend: only the immediate dependency — Stage 4 needs Stage 3, not Stage 1 and 2.)
