# Revised Architecture Plan: /workflow-builder v2.0

> **Supersedes:** `.hermes/plans/2026-07-04_120000-architecture-review-workflow-builder.md`
> **Status:** DRAFT — awaiting review
> **Authored by:** Hermes (default) for agentic profile
> **Date:** 2026-07-04
> **Phase:** Architecture design — no code execution

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Baseline](#2-current-state-baseline)
3. [Enhancement 1: One-Command Claude Code Build](#3-enhancement-1-one-command-claude-code-build)
4. [Enhancement 2: Improved UX](#4-enhancement-2-improved-ux)
5. [Enhancement 3: Flowable MCP Integration](#5-enhancement-3-flowable-mcp-integration)
6. [Enhancement 4: Cheap Model Compatibility](#6-enhancement-4-cheap-model-compatibility)
7. [Enhancement 5: Staged YAML Output](#7-enhancement-5-staged-yaml-output)
8. [Unified Target Architecture](#8-unified-target-architecture)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Risks and Mitigations](#10-risks-and-mitigations)
11. [Constitution Compliance](#11-constitution-compliance)

---

## 1. Executive Summary

The existing `/workflow-builder` command has strong spec-driven design (8/10 architecture score) but weak execution capability (4.2/10 overall). This plan defines a v2.0 architecture that:

1. Makes `/workflow-builder` a single-command experience inside Claude Code
2. Delivers progressive, humane UX with streaming progress and partial outputs
3. Connects to Flowable REST via a lightweight MCP server for deploy/validate/query
4. Works reliably on cheap models through prompt splitting and schema summarization
5. Outputs 6 incremental YAML files instead of one monolithic 1,200+ line blob

The target is a developer typing `/workflow-builder "User story"` in Claude Code and getting — in one command — a validated, staged, Flowable-ready blueprint with full progress visibility.

---

## 2. Current State Baseline

### What exists (v0.1)

| Layer | Component | Status |
|-------|-----------|--------|
| Specs | pipeline.yaml (6 steps), schema.yaml (28 sections), validation-rules.yaml (16 rules), maturity-levels.yaml (L1-L6) | ✅ Complete |
| Knowledge | domain-knowledge/index.yaml with trigger-map + implication-map, hidden-requirement-discovery skill | ✅ Complete |
| Adapters | `.claude/commands/workflow-builder.md`, `.opencode/`, `.cursor/commands/`, `.github/prompts/` | ✅ Complete |
| Templates | BPMN, CMMN, DMN, Form templates under `.templates/flowable/` | ✅ Stubs only |
| Skills | flowable/bpmn-modeling, cmmn-modeling, dmn-modeling, form-modeling, root-model-selection | ✅ YAML specs only |
| CLI | `packages/awp-cli/` — prompt assembly only (concatenates files, no model calls) | ⚠️ v0.1 minimal |
| Scripts | `flowable-deploy-test.mjs`, `bpmn-roundtrip.mjs` | ✅ Working |
| Workflows | `greenfield-flowable.yaml` (10-stage S01-S10), `brownfield-flowable.yaml` | ✅ Specs only |

### Critical gaps (from review)

- **No end-to-end execution.** User must manually `cat prompt.md | claude > blueprint.yaml`.
- **No Flowable MCP.** Skills are YAML stubs; no REST API client, no deploy/validate tooling.
- **No staged output.** Single monolithic YAML with 28 sections; no incremental stages.
- **Cheap models fail.** 8,200 token prompt + 15,000 token expected output overwhelms small-context models.
- **No progress feedback.** LLM works silently, dumps everything at the end; no error recovery.

### What stays (non-negotiable per constitution)

- Constitution remains supreme authority (`.ai/constitution.md`)
- 6-step pipeline logic (parse-story → classify-domains → expand-hidden → resolve-constraints → populate-schema → emit-and-validate)
- 28-section schema contract with 16 validation rules
- L1-L6 maturity levels (cumulative, additive-only)
- 4 invariants: additive-only, no-silent-gaps, traceability, actionability
- Human approval gates (G1-G5) remain required for Flowable deployment
- All artifacts carry trace blocks; broken traces fail gates

---

## 3. Enhancement 1: One-Command Claude Code Build

### Target experience

```
User (in Claude Code):  /workflow-builder "Create Login and Registration"
Claude Code:            [1/6] Initialized — story parsed: Login+Registration, 3 actors, 5 capabilities
Claude Code:            [2/6] In Progress — 4 explicit domains, running hidden-discovery...
Claude Code:            [3/6] Generating App — 28 cross-cutting domains resolved
Claude Code:            [4/6] Generating Root Models — BPMN process selected, data dictionary built
Claude Code:            [5/6] Generating Dependent Models — email-verification, password-reset
Claude Code:            [6/6] Generating Forms — 8 form definitions generated
Claude Code:            ✓ Written: blueprints/login-registration/ (6 files, 2,840 lines)
                        ✓ Validation: 16/16 rules passed
                        ✓ Flowable deploy-ready
```

### Architecture

Three layers work together to deliver the single-command experience:

```
┌──────────────────────────────────────────────────────────┐
│ Layer 1: Claude Code Adapter                              │
│ .claude/commands/workflow-builder.md (revised)            │
│                                                          │
│  - Accepts $ARGUMENTS                                     │
│  - Delegates to prompt.md (canonical source unchanged)    │
│  - NEW: Calls awp build --execute when available          │
│  - FALLBACK: Executes prompt inline when CLI unavailable  │
│  - NEW: Streams stage progress markers                    │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│ Layer 2: awp-cli (v0.2)                                   │
│ packages/awp-cli/src/commands/build.js                    │
│                                                          │
│  awp build "story" --execute                              │
│    ├── 1. Assemble prompt (prompt.md + schema + domains)  │
│    ├── 2. Call configured model (Anthropic API / Ollama)  │
│    ├── 3. Stream progress markers                         │
│    ├── 4. Write staged YAML files                         │
│    └── 5. Print coverage report                           │
│                                                          │
│  awp build "story" (no --execute)                         │
│    └── Existing behaviour: output .prompt.md only         │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│ Layer 3: Model Interface                                  │
│ packages/awp-cli/src/model.js (NEW)                       │
│                                                          │
│  - Providers: anthropic, openai, ollama, flowable-mcp     │
│  - Config: .awp/config.yaml (model, api-key, tier)        │
│  - Tier-aware: auto-selects prompt variant                │
│  - Streaming: yields stage markers for UI layer           │
└──────────────────────────────────────────────────────────┘
```

### Claude Code adapter revision

The `.claude/commands/workflow-builder.md` adapter gains:
1. A `--execute` passthrough that delegates to `awp build --execute` when the CLI package is installed
2. A fallback inline-execution mode that runs the prompt directly through Claude (current behaviour preserved)
3. Stage-progress markers passed through to the user

### Key design decisions

- **Prompt.md stays canonical.** All adapters continue to delegate to `.commands/workflow-builder/prompt.md`. The `awp build --execute` path calls the model programmatically, but the prompt content is assembled from the same files.
- **No lock-in.** The adapter works with or without `awp-cli` installed. Without it, the current inline-execution behaviour remains.
- **Config file.** A new `.awp/config.yaml` stores model preference, API keys (env-var references only), and tier settings. Never committed; `.gitignore` by default.

---

## 4. Enhancement 2: Improved UX

### Current pain points mapped to solutions

| Pain Point | Solution |
|------------|----------|
| Silent generation — no progress | Stage markers streamed during generation (Initialized → In Progress → ...) |
| Monolithic 1,200+ line output | 6 incremental files in a directory; user navigates by stage |
| All-or-nothing failure | Partial recovery: each stage writes independently; failure at stage N preserves stages 1..N-1 |
| Dense prompt overwhelms | Tiered prompt variants; small models get simplified instructions |
| No error guidance | Validation failures emit specific rule IDs and suggested fixes |
| Hard to discover cross-cutting | Coverage report now links hidden requirements to their discovery rules inline |

### UI contract: stage markers

Every model interaction (whether via `awp build --execute` or inline Claude Code execution) emits stage markers at a consistent format:

```
[STAGE 1/6] Initialized — <parsed summary>
[STAGE 2/6] In Progress — <domain count> domains, <hidden count> hidden
[STAGE 3/6] Generating App — <cross-cutting count> cross-cutting domains resolved
[STAGE 4/6] Generating Root Models — <model type> + data dictionary
[STAGE 5/6] Generating Dependent Models — <count> child models
[STAGE 6/6] Generating Forms — <count> forms
```

The marker prefix `[STAGE N/6]` is stable enough for tools to parse but human-readable enough for terminal output.

### Partial recovery

If stage 5 fails (model exhaustion, API error), stages 1-4 are already written to disk. The user can:
```bash
awp build --resume-from=stage-5 --context=blueprints/login-registration/04-dependent-models.yaml
```

This re-runs only the failed stage, using prior stages as context. The resume flag respects the same model tier and configuration.

### Coverage report (revised)

```
─────────────────────────────────────────────
/workflow-builder — Coverage Report
─────────────────────────────────────────────
Story:        "Create Login and Registration"
Maturity:     L6 (Enterprise)
Domains:      32 activated (4 explicit, 28 hidden, 0 not-applicable)
Hidden reqs:  87 added across 14 domains
Validation:   16/16 rules passed ✓
Assumptions:  12 → blueprints/login/05-app.yaml §assumptions
─────────────────────────────────────────────
Files written:
  blueprints/login/
  ├── 01-initialized.yaml         (  120 lines) — story, domains, maturity
  ├── 02-in-progress.yaml         (  210 lines) — active requirements, constraints
  ├── 03-generating-app.yaml      (  380 lines) — BPMN process, data dict
  ├── 04-root-models.yaml         (  150 lines) — root BPMN/CMMN + security
  ├── 05-dependent-models.yaml    (  200 lines) — email-verify, password-reset
  └── 06-forms.yaml               (  170 lines) — 8 form definitions
  Total: 1,230 lines across 6 files
─────────────────────────────────────────────
Flowable ready: ✓  (deploy with `awp flowable deploy blueprints/login/`)
─────────────────────────────────────────────
```

---

## 5. Enhancement 3: Flowable MCP Integration

### Architecture

A lightweight MCP server exposes Flowable's REST API as a set of tools that Claude Code (or any MCP client) can call directly. This replaces the current YAML-only skill stubs with executable tooling.

```
┌──────────────────────────────────────────────────────────┐
│  MCP Server: flowable-mcp-server                          │
│  packages/flowable-mcp-server/ (NEW)                      │
│                                                          │
│  Tools exposed:                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ flowable.deploy          POST /repository/deployments│  │
│  │ flowable.list_processes  GET  /repository/process-  │  │
│  │                          definitions                │  │
│  │ flowable.start_process   POST /runtime/process-     │  │
│  │                          instances                  │  │
│  │ flowable.complete_task   POST /runtime/tasks/{id}   │  │
│  │ flowable.query_tasks     GET  /runtime/tasks        │  │
│  │ flowable.validate_bpmn   Deploy-then-delete (dry-run)│  │
│  │ flowable.get_form        GET  /form/form-data       │  │
│  │ flowable.health_check    GET  /service/management/  │  │
│  │                          engine                     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Config: FLOWABLE_URL, FLOWABLE_USER, FLOWABLE_PASS       │
└──────────────────────────────────────────────────────────┘
```

### Flowable MCP workflow integration

The MCP server bridges the gap between blueprint YAML and a running Flowable engine:

```
blueprints/<slug>/*.yaml
        │
        ▼
┌─────────────────────────────────────┐
│ awp flowable convert                │  (NEW command)
│                                     │
│ Reads staged YAML files, converts   │
│ to Flowable-native formats:         │
│  - BPMN 2.0 XML                     │
│  - CMMN 1.1 XML                     │
│  - DMN 1.3 XML                      │
│  - Flowable Form JSON               │
│                                     │
│ Output: blueprints/<slug>/flowable/ │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ flowable-mcp-server (deploy)        │
│                                     │
│ Deploys all generated .xml and      │
│ .form.json files to the Flowable    │
│ engine via REST API.                │
│                                     │
│ Returns: deployment IDs, process    │
│ definition keys, deployment report  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ flowable-mcp-server (validate)      │
│                                     │
│ Dry-run deploy, engine parses XML,  │
│ returns validation errors if any.   │
│ Rolls back after validation.        │
└─────────────────────────────────────┘
```

### Claude Code integration

The Claude Code experience after generation:

```
> awp flowable deploy blueprints/login/

Deploying to Flowable at http://localhost:8080/flowable-rest...
  ✓ login-process.bpmn20.xml       → deployment id: abc123
  ✓ email-verification.bpmn20.xml  → deployment id: abc124
  ✓ password-reset.bpmn20.xml      → deployment id: abc125
  ✓ login-form.form.json           → form key: login-form-v1
  ✓ password-policy.dmn            → decision table: password-policy
3 processes, 1 form, 1 decision table deployed successfully.
```

### Familiar Flowable terminology

The MCP tools use Flowable-native vocabulary throughout:
- `process-definitions` (not "workflows")
- `case-definitions` (not "cases")
- `decision-tables` (not "rules")
- `form-definitions` (not "screens")
- `deployments`, `process-instances`, `tasks`

This ensures Flowable-experienced developers find the tools immediately familiar (per Requirement 4).

### Existing assets upgraded

The current YAML-only skill stubs in `.skills/flowable/` become **executable** by delegating to the MCP server:
- `.skills/flowable/bpmn-modeling/` → calls `flowable.validate_bpmn` after generation
- `.skills/flowable/form-modeling/` → calls `flowable.get_form` to retrieve existing form schema
- `.skills/flowable/root-model-selection/` → queries engine for existing process definitions

---

## 6. Enhancement 4: Cheap Model Compatibility

### Strategy: tiered prompting

Instead of one 8,200-token prompt, the system sends the minimum context needed for each model tier and stage:

| Tier | Models | Max Context | Prompt Strategy | Stages |
|------|--------|-------------|-----------------|--------|
| `small` | GPT-3.5, Llama 8B, Haiku | 8K | Schema-summarized, stage-by-stage | L1-L3 only |
| `medium` | GPT-4o-mini, Claude Sonnet | 32K | Full schema, incremental stages | L1-L5 |
| `large` | GPT-4o, Claude Opus | 100K+ | Full prompt, monolithic or staged | L1-L6 all stages |

### Schema summarization (for `small` tier)

A new file `.schemas/workflow-blueprint/schema-summary.yaml` provides a condensed view:
- Section names + required fields only (no descriptions)
- Attribute types preserved
- Validation rules referenced by ID, not inlined

This drops the schema component from ~4,500 tokens to ~800 tokens.

### Incremental prompting (for `medium` tier)

Instead of sending all 28 sections in one prompt, the model gets sections relevant to the current stage:

```
Stage 3 (Generating App):
  → schema sections: project, domains, requirements, actors, roles, data-model
  → domain-knowledge: trigger-map only (no implication closure yet)

Stage 4 (Generating Root Models):
  → schema sections: workflows, forms, pages, api, events, integrations
  → domain-knowledge: implication-map for active domains only

Stage 5 (Generating Dependent Models):
  → schema sections: security, audit, logging, monitoring
  → prior stages provided as context
```

### Tier detection

The system auto-detects the model tier from the configured model name, or accepts `--model-tier=small|medium|large` as an explicit flag:

```bash
awp build "story" --model-tier=small    # forces small-tier prompt
awp build "story"                       # auto-detect from configured model
```

### Validation as post-processing (not LLM-dependent)

For cheap models that hallucinate validation compliance, a **deterministic** validation step runs after each stage:

```bash
awp validate blueprints/<slug>/03-generating-app.yaml
```

This runs the 16 validation rules as machine-checkable assertions (YAML schema + cross-reference checks), not as LLM prompts. A cheap model can produce messy YAML; the validator catches structural errors independently.

### Cost analysis

| Scenario | v0.1 (monolithic) | v2.0 (staged, cheap-model) |
|----------|-------------------|---------------------------|
| Model | Claude Opus only | GPT-3.5 for L1-L3, Claude Sonnet for L4-L6 |
| Prompt tokens | 8,200 | ~2,500 (L1-L3 avg) + ~4,000 (L4-L6) |
| Output tokens | ~15,000 | ~5,000 (stages 1-3) + ~10,000 (stages 4-6) |
| Total cost (est.) | ~$0.50 (Opus) | ~$0.08 (GPT-3.5 + Sonnet) |
| Context fit | ❌ fails on 8K models | ✅ each stage fits in 8K |

---

## 7. Enhancement 5: Staged YAML Output

### The 6 stages (from user requirement)

```
┌──────────────────────────────────────────────────────────┐
│ Stage 1: Initialized                                      │
│ File: 01-initialized.yaml                                 │
│                                                          │
│ Contents:                                                 │
│  - project (name, id, story, summary, scope)              │
│  - parsed-intent (actors, capabilities, constraints,      │
│    negations)                                             │
│  - maturity-level selected                                │
│  - explicit-domains (from trigger-map match)              │
│  - model-tier detected                                    │
│                                                          │
│ Depends on: nothing                                       │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Stage 2: In Progress                                      │
│ File: 02-in-progress.yaml                                 │
│                                                          │
│ Contents:                                                 │
│  - domains (all: explicit + hidden + not-applicable)      │
│  - requirements (explicit + hidden, fully attributed)     │
│  - constraints (resolved with source citations)           │
│  - assumptions (with validation-needed questions)         │
│  - risks (initial identification)                         │
│                                                          │
│ Depends on: 01-initialized.yaml                           │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Stage 3: Generating App                                   │
│ File: 03-generating-app.yaml                              │
│                                                          │
│ Contents:                                                 │
│  - actors (all human/system/service/scheduler)            │
│  - roles (permission model with SoD)                      │
│  - data-model (entities, attributes, relationships)       │
│  - master-data (reference data definitions)               │
│  - knowledge (domain glossary, rules catalog)             │
│  - app-container metadata (name, version, description)    │
│                                                          │
│ Depends on: 02-in-progress.yaml                           │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Stage 4: Generating Root Models                           │
│ File: 04-root-models.yaml                                 │
│                                                          │
│ Contents:                                                 │
│  - root-model-decision (BPMN process or CMMN case)        │
│  - root-workflow (main process/case definition)           │
│  - root-workflow-steps (with on-failure for each step)    │
│  - root-data-dictionary (formal data model for root)      │
│  - security (authN, authZ, session, password, lockout)    │
│  - api (endpoints with 2+ responses each)                 │
│  - events (domain events published/consumed)              │
│  - integrations (external systems, protocols, contracts)  │
│                                                          │
│ Depends on: 03-generating-app.yaml                        │
│  Independent: yes — root model does not depend on children │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Stage 5: Generating Dependent Models                      │
│ File: 05-dependent-models.yaml                            │
│                                                          │
│ Contents:                                                 │
│  - dependent-workflows (child BPMN/CMMN processes),       │
│    each referencing root-model                            │
│  - sub-processes (called from root workflow)              │
│  - dmn-decision-tables (business rules)                   │
│  - notifications (email, push, SMS, in-app)               │
│  - monitoring (SLOs, alerts, dashboards)                  │
│  - logging (structured log events)                        │
│  - audit (audit events, retention policy)                 │
│                                                          │
│ Depends on: 04-root-models.yaml                           │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ Stage 6: Generating Forms                                 │
│ File: 06-forms.yaml                                       │
│                                                          │
│ Contents:                                                 │
│  - forms (all user-task forms from root + dependent)      │
│  - form-fields (with validation + error-message each)     │
│  - pages (UI page definitions)                            │
│  - testing (golden scenarios, test strategy)              │
│  - deployment (envs, config, migration plan)              │
│  - operations (runbooks, recovery procedures)             │
│  - support (troubleshooting guides)                       │
│  - documentation (user docs, API docs)                    │
│  - governance (approval records, trace matrix)            │
│  - compliance (GDPR, SOC2, data retention)                │
│                                                          │
│ Depends on: 04-root-models.yaml, 05-dependent-models.yaml │
└──────────────────────────────────────────────────────────┘
```

### Dependency graph

```
01-initialized ─── independent
      │
      ▼
02-in-progress ─── depends on 01
      │
      ▼
03-generating-app ─── depends on 02
      │
      ▼
04-root-models ─── depends on 03
      │
      ├──────────────────────┐
      ▼                      ▼
05-dependent-models    06-forms
depends on 04          depends on 04 + 05
```

Stages 5 and 6 can run **in parallel** after stage 4 is complete, since 06-forms depends on both 04-root-models and 05-dependent-models but the system can start form generation against the root model while dependent models are being generated, merging at the end.

### Staging config (new file: `.commands/workflow-builder/stages.yaml`)

```yaml
id: workflow-builder-stages
version: 1.0.0

stages:
  - id: stage-01
    name: Initialized
    file: 01-initialized.yaml
    pipeline-steps: [parse-story]
    depends_on: []
    parallel_group: null

  - id: stage-02
    name: In Progress
    file: 02-in-progress.yaml
    pipeline-steps: [classify-domains, expand-hidden, resolve-constraints]
    depends_on: [stage-01]
    parallel_group: null

  - id: stage-03
    name: Generating App
    file: 03-generating-app.yaml
    pipeline-steps: [populate-schema]
    schema_sections: [project, domains, requirements, actors, roles, data-model, master-data, knowledge, app-container]
    depends_on: [stage-02]
    parallel_group: null

  - id: stage-04
    name: Generating Root Models
    file: 04-root-models.yaml
    pipeline-steps: [populate-schema]
    schema_sections: [workflows, security, api, events, integrations]
    depends_on: [stage-03]
    parallel_group: null

  - id: stage-05
    name: Generating Dependent Models
    file: 05-dependent-models.yaml
    pipeline-steps: [populate-schema]
    schema_sections: [workflows, notifications, monitoring, logging, audit]
    depends_on: [stage-04]
    parallel_group: forms-group

  - id: stage-06
    name: Generating Forms
    file: 06-forms.yaml
    pipeline-steps: [populate-schema, emit-and-validate]
    schema_sections: [forms, pages, testing, deployment, operations, support, documentation, governance, compliance]
    depends_on: [stage-04, stage-05]
    parallel_group: forms-group
```

### Backward compatibility

The monolithic 28-section blueprint (`blueprint.yaml`) is retained as an **optional L6-only** aggregation. The `awp build` command without `--staged` produces the single file (current behaviour). The `--staged` flag enables incremental output. The Claude Code adapter defaults to `--staged` in v2.0.

---

## 8. Unified Target Architecture

### Complete system diagram

```
                              ┌──────────────────────┐
                              │   User (Claude Code)  │
                              │   /workflow-builder   │
                              │   "Create Login..."   │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │  .claude/commands/    │
                              │  workflow-builder.md  │
                              │  (Adapter v2.0)       │
                              └──────────┬───────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
         ┌──────────▼──────────┐ ┌──────▼──────┐ ┌──────────▼──────────┐
         │ awp build --execute │ │ awp build    │ │ Inline Claude       │
         │ (CLI v0.2)          │ │ (CLI v0.1)   │ │ execution           │
         │                     │ │              │ │ (fallback)          │
         │ Model call via API  │ │ Prompt only  │ │ Runs prompt.md     │
         │ Streaming stages    │ │              │ │ directly            │
         └──────────┬──────────┘ └──────┬──────┘ └──────────┬──────────┘
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         │
                              ┌──────────▼───────────┐
                              │  Prompt Assembly     │
                              │  (prompt.md + schema │
                              │   + domains + tier)  │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │  Staged Generation    │
                              │  6 stages, 6 files    │
                              │  (or monolithic)      │
                              └──────────┬───────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
         ┌──────────▼──────────┐ ┌──────▼──────┐ ┌──────────▼──────────┐
         │ Validation Engine   │ │ Converter   │ │ Coverage Reporter   │
         │ (16 rules, machine- │ │ YAML→BPMN   │ │                     │
         │  checkable)         │ │ YAML→CMMN   │ │ domains, hidden,    │
         │                     │ │ YAML→DMN    │ │ assumptions, pass/  │
         │ packages/awp-       │ │ YAML→Form   │ │ fail                │
         │ validate/           │ │             │ │                     │
         └─────────────────────┘ └──────┬──────┘ └─────────────────────┘
                                         │
                              ┌──────────▼───────────┐
                              │  Flowable MCP Server  │
                              │                       │
                              │  flowable.deploy      │
                              │  flowable.validate    │
                              │  flowable.start_...   │
                              │  flowable.query_...   │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │  Flowable REST Engine │
                              │  (local or cloud)     │
                              └──────────────────────┘
```

### New/revised files summary

| File | Action | Purpose |
|------|--------|---------|
| `.commands/workflow-builder/stages.yaml` | **New** | 6-stage definition with schema sections per stage |
| `.commands/workflow-builder/tiers.yaml` | **New** | Model tier definitions (small/medium/large) |
| `.schemas/workflow-blueprint/schema-summary.yaml` | **New** | Condensed schema for small models (~800 tokens) |
| `.claude/commands/workflow-builder.md` | **Revise** | Add `--execute` passthrough, stage markers |
| `.awp/config.yaml` | **New** | CLI config (model, API refs, tier, output format) |
| `packages/awp-cli/src/commands/build.js` | **Revise** | Add `--execute`, `--staged`, `--model-tier`, `--resume-from` |
| `packages/awp-cli/src/model.js` | **New** | Model interface (Anthropic, OpenAI, Ollama providers) |
| `packages/awp-cli/src/stages.js` | **New** | Stage orchestration engine (order, dependencies, parallelism) |
| `packages/awp-cli/src/validate.js` | **New** | Deterministic YAML validation (16 rules, machine-checkable) |
| `packages/flowable-mcp-server/` | **New** | MCP server package (9 Flowable REST tools) |
| `packages/flowable-mcp-server/src/tools/` | **New** | Individual tool implementations |
| `.skills/flowable/bpmn-modeling/` | **Revise** | Connect to MCP server for validation |
| `.skills/flowable/cmmn-modeling/` | **Revise** | Connect to MCP server |
| `.skills/flowable/dmn-modeling/` | **Revise** | Connect to MCP server |
| `.skills/flowable/form-modeling/` | **Revise** | Connect to MCP server |
| `.skills/flowable/root-model-selection/` | **Revise** | Query engine for existing definitions |

### Directory layout (post-implementation)

```
ai-workflow-platform/
├── .ai/constitution.md
├── .awp/config.yaml                          # NEW
├── .claude/commands/workflow-builder.md      # REVISED
├── .commands/workflow-builder/
│   ├── prompt.md
│   ├── command.yaml
│   ├── pipeline.yaml
│   ├── maturity-levels.yaml
│   ├── stages.yaml                           # NEW
│   └── tiers.yaml                            # NEW
├── .schemas/workflow-blueprint/
│   ├── schema.yaml
│   ├── schema-summary.yaml                   # NEW
│   ├── validation-rules.yaml
│   └── mini-example.yaml
├── .skills/flowable/                         # REVISED (connect to MCP)
├── packages/
│   ├── awp-cli/                              # REVISED (v0.2)
│   │   └── src/
│   │       ├── commands/build.js
│   │       ├── model.js                      # NEW
│   │       ├── stages.js                     # NEW
│   │       └── validate.js                   # NEW
│   └── flowable-mcp-server/                  # NEW
│       ├── package.json
│       ├── src/
│       │   ├── index.js
│       │   └── tools/
│       │       ├── deploy.js
│       │       ├── validate-bpmn.js
│       │       ├── start-process.js
│       │       ├── complete-task.js
│       │       ├── query-tasks.js
│       │       ├── list-processes.js
│       │       ├── get-form.js
│       │       └── health-check.js
│       └── test/
├── scripts/
│   ├── flowable-deploy-test.mjs
│   └── bpmn-roundtrip.mjs
└── blueprints/                               # Output directory
    └── login-registration/
        ├── 01-initialized.yaml
        ├── 02-in-progress.yaml
        ├── 03-generating-app.yaml
        ├── 04-root-models.yaml
        ├── 05-dependent-models.yaml
        ├── 06-forms.yaml
        ├── blueprint.yaml                    # Optional L6 aggregate
        └── flowable/                         # Converted deployable artifacts
            ├── login-process.bpmn20.xml
            ├── email-verification.bpmn20.xml
            ├── login-form.form.json
            └── deploy-report.json
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Staged output + cheap model compatibility, no new dependencies.

| # | Task | Deliverable | Dependencies |
|---|------|-------------|--------------|
| F1.1 | Create `.commands/workflow-builder/stages.yaml` | Stage definitions with schema section mappings | None |
| F1.2 | Create `.commands/workflow-builder/tiers.yaml` | Tier definitions (small/medium/large) | None |
| F1.3 | Create `.schemas/workflow-blueprint/schema-summary.yaml` | Condensed schema (< 1,000 tokens) | None |
| F1.4 | Create `.awp/config.yaml` template | CLI config with env-var placeholders | None |
| F1.5 | Update prompt.md | Add stage markers, tier awareness, incremental sections | F1.1, F1.2 |
| F1.6 | Revise Claude Code adapter | Add `--execute` passthrough, stage markers | F1.5 |

**Acceptance:** `/workflow-builder "test"` in Claude Code emits stage markers and writes 6 files. Manual-only (no `awp build --execute` yet).

### Phase 2: CLI Execution (Week 3-4)

**Goal:** Programmatic model calling, streaming, deterministic validation.

| # | Task | Deliverable | Dependencies |
|---|------|-------------|--------------|
| F2.1 | Create `packages/awp-cli/src/model.js` | Anthropic + OpenAI + Ollama providers | None |
| F2.2 | Create `packages/awp-cli/src/stages.js` | Stage orchestration engine | F1.1 |
| F2.3 | Create `packages/awp-cli/src/validate.js` | Deterministic validation engine (16 rules) | None |
| F2.4 | Revise `build.js` | Add `--execute`, `--staged`, `--model-tier`, `--resume-from` | F2.1, F2.2, F2.3 |
| F2.5 | Add CLI tests | Test prompt assembly, stage ordering, validation | F2.4 |

**Acceptance:** `awp build "story" --execute --staged` produces validated 6-file output with streaming progress.

### Phase 3: Flowable MCP (Week 5-6)

**Goal:** Full Flowable REST integration via MCP server.

| # | Task | Deliverable | Dependencies |
|---|------|-------------|--------------|
| F3.1 | Create `packages/flowable-mcp-server/` | MCP server scaffold | None |
| F3.2 | Implement 9 MCP tools (deploy, validate_bpmn, start_process, complete_task, query_tasks, list_processes, get_form, health_check) | Working MCP tools | F3.1 |
| F3.3 | Create `awp flowable convert` command | YAML → BPMN/CMMN/DMN/Form conversion | F2.4 |
| F3.4 | Revise Flowable skills | Connect YAML stubs → MCP server calls | F3.2 |
| F3.5 | MCP server tests | Integration tests against Flowable Docker container | F3.2, F3.3 |

**Acceptance:** `awp flowable deploy blueprints/<slug>/` deploys all generated artifacts to a running Flowable engine.

### Phase 4: Polish (Week 7)

**Goal:** Edge cases, brownfield support, documentation.

| # | Task | Deliverable | Dependencies |
|---|------|-------------|--------------|
| F4.1 | Brownfield staging support | `--context` flag works with staged output | F2.4 |
| F4.2 | Error recovery hardening | All stage failures preserve prior stages, `--resume-from` works | F2.4 |
| F4.3 | Update golden examples | Staged output for login-registration example | F2.4, F3.3 |
| F4.4 | Documentation | Updated AGENTS.md, README, workflow-builder command docs | All prior |

**Acceptance:** Full end-to-end flow works for both greenfield and brownfield scenarios.

---

## 10. Risks and Mitigations

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| Staged output breaks existing consumers of monolithic blueprint | Medium | Medium | Keep monolithic `blueprint.yaml` as optional L6 aggregate; staged is default but not mandatory |
| Flowable MCP requires running Flowable engine | High | High | Support `flowable.cloud` mode (Flowable Cloud REST API) and `flowable.local` (Docker). Engine health check tool reports connectivity status. Make engine dependency optional — validate converts without deployment |
| Cheap models produce invalid YAML even with summarization | Medium | Medium | Deterministic validation runs post-generation (not LLM-dependent). Invalid YAML produces structured errors, not rejected output |
| Splitting prompt increases total API calls (higher latency) | Low | High | Stages 5 and 6 run in parallel. Total tokens are similar; latency increases but cost decreases (cheaper models per stage) |
| awp-cli v0.2 introduces new dependencies | Low | Low | `model.js` uses standard HTTP (fetch/node-fetch). `stages.js` and `validate.js` use only `yaml` dependency (already present). MCP server is a separate package |
| Claude Code adapter changes break existing users | Medium | Low | Adapter preserves fallback to inline execution. New `--execute` path is additive, not a replacement |
| Parallel stages (5+6) cause race conditions in file writing | Low | Low | Each stage writes to its own file. Only stage 6 reads both 04 and 05; merging is deterministic |

---

## 11. Constitution Compliance

This architecture plan respects all constitutional principles and constraints:

| Principle | Compliance |
|-----------|------------|
| **P1. Spec before implementation** | ✅ This plan is the spec. No code is generated until approved. |
| **P2. Human approval gates** | ✅ G1-G5 gates remain required for Flowable deployment (greenfield-flowable.yaml unchanged). |
| **P3. Traceability** | ✅ All staged outputs carry discovery source citations. Validation engine enforces VAL-012 (traceability). |
| **P4. Reusable assets** | ✅ MCP server is a reusable package. Staged blueprints are composable (each stage usable independently). |
| **P5. Knowledge preservation** | ✅ Domain knowledge and hidden-requirement discovery remain unchanged. New `tiers.yaml` and `stages.yaml` are versioned. |
| **R1. Agents never approve gates** | ✅ Unchanged. No agent gate approval introduced. |
| **R2. Generation blocked without approval** | ✅ Unchanged. `awp flowable deploy` respects existing gate state. |
| **R3. Mandatory human approvals** | ✅ Unchanged. |
| **R4. Artifact trace blocks** | ✅ Staged YAML files include trace blocks referencing upstream stages. |
| **R5. Sealed artifacts immutable** | ✅ Unchanged. |
| **C1. No platform lock-in** | ✅ All specs remain Markdown/YAML. MCP server is standard MCP protocol (platform-agnostic). |
| **C2. Stable paths** | ✅ No existing paths changed. New files are additive. |
| **C5. No secrets** | ✅ `.awp/config.yaml` references env vars only; never committed. |
| **Authority order** | ✅ Constitution > Pipeline > Stages > Tiers. No contradiction. |

---

## Appendix A: Scorecard (Target State)

| Requirement | Score (Current) | Score (Target) | How |
|-------------|-----------------|----------------|-----|
| 1. One-command build | 6/10 | **9/10** | `awp build --execute` + Claude Code adapter |
| 2. Easy to use | 5/10 | **8/10** | Stage markers, partial recovery, structured coverage report |
| 3. Good architecture | 8/10 | **9/10** | Deterministic validation, stage orchestration engine, parallel stages |
| 4. Flowable MCP ready | 2/10 | **8/10** | 9-tool MCP server, YAML→Flowable converter, Flowable-native terminology |
| 5. Cheap model compatible | 3/10 | **8/10** | Tiered prompting, schema summarization, incremental stages, deterministic validation |
| 6. Staged YAML delivery | 1/10 | **9/10** | 6 incremental files, dependency graph, parallel stage groups |
| **OVERALL** | **4.2/10** | **8.5/10** | |

---

## Appendix B: Key Dependencies (npm)

```
packages/awp-cli/package.json (revised):
  "yaml": "^2.9.0"                              # existing
  "zod": "^3.x"                                  # validation schemas (NEW)

packages/flowable-mcp-server/package.json (NEW):
  "@modelcontextprotocol/sdk": "^1.x"            # MCP server SDK
  "zod": "^3.x"                                  # tool parameter validation
```

No other new dependencies. The MCP server communicates with Flowable REST via standard `fetch` (Node 18+).

---

## Appendix C: What This Plan Does NOT Change

- `.ai/constitution.md` — unchanged (supreme authority)
- `.commands/workflow-builder/pipeline.yaml` — unchanged (6-step pipeline logic preserved)
- `.commands/workflow-builder/maturity-levels.yaml` — unchanged (L1-L6 cumulative levels)
- `.schemas/workflow-blueprint/schema.yaml` — unchanged (28-section output contract)
- `.schemas/workflow-blueprint/validation-rules.yaml` — unchanged (16 validation rules)
- `.memory/domain-knowledge/index.yaml` — unchanged (trigger-map + implication-map)
- `.skills/hidden-requirement-discovery/` — unchanged
- `.workflows/greenfield-flowable.yaml` — unchanged (10-stage gate pipeline)
- `.workflows/brownfield-flowable.yaml` — unchanged
- `scripts/flowable-deploy-test.mjs` — unchanged
- `scripts/bpmn-roundtrip.mjs` — unchanged
