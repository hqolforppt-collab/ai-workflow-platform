
# Architecture & Efficiency Review: /workflow-builder Command

> **For Hermes:** Read-only review — no code changes. Analysis only.
> **Goal:** Review the workflow-builder command architecture against 6 requirements
>   for Claude Code integration, Flowable MCP, cheap-model compatibility, and
>   staged YAML delivery.
> **Reviewed by:** Hermes (default profile) on behalf of agentic profile
> **Date:** 2026-07-04

---

## Requirements Summary (User's 6 Criteria)

| # | Requirement | Target |
|---|-------------|--------|
| 1 | Easy to build the command for Claude Code — one command | Developer UX |
| 2 | Easy to use for users | End-user UX |
| 3 | Good structure and architecture | Code quality |
| 4 | Easy to use by Flowable MCP, familiar with Flowable tools | Integration |
| 5 | Any cheap model can use it effectively | Model compatibility |
| 6 | Deliver one YAML per user input, good structure from independent to dependent, staged: Initialized → In Progress → Generating App → Generating Root Models → Generating Dependent Models → Generating Forms | Output format |

---

## Current Architecture (What Exists)

### Core pipeline

```
User types: /workflow-builder "Create Login Feature"
     │
     ▼
┌─────────────────────────────────────────────────────┐
│  awp build "story" (packages/awp-cli/src/commands/  │
│  build.js)                                          │
│                                                     │
│  Assembles a prompt file from:                      │
│  1. prompt.md (6-step LLM instructions)             │
│  2. domain-knowledge/index.yaml (trigger+implication)│
│  3. schema.yaml (28-section output contract)        │
│  4. maturity-levels.yaml (L1-L6)                   │
│                                                     │
│  Output: blueprints/<slug>.prompt.md                │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼  (MANUAL STEP — user pipes to model)
┌─────────────────────────────────────────────────────┐
│  cat prompt.md | claude > blueprint.yaml            │
│                                                     │
│  LLM executes 6-step pipeline:                      │
│  1. parse-story                                     │
│  2. classify-domains (trigger-map)                  │
│  3. expand-hidden (implication closure)             │
│  4. resolve-constraints                             │
│  5. populate-schema (28 sections)                   │
│  6. emit-and-validate (16 rules)                    │
│                                                     │
│  Output: ONE monolithic YAML (28 sections)          │
└─────────────────────────────────────────────────────┘
```

### Key files

| File | Role |
|------|------|
| `.commands/workflow-builder/prompt.md` | LLM execution prompt (6-step pipeline) |
| `.commands/workflow-builder/command.yaml` | Command spec (inputs/outputs/platforms) |
| `.commands/workflow-builder/pipeline.yaml` | 6-step pipeline definition |
| `.commands/workflow-builder/maturity-levels.yaml` | L1-L6 maturity levels |
| `.schemas/workflow-blueprint/schema.yaml` | 28-section output contract |
| `.schemas/workflow-blueprint/validation-rules.yaml` | 16 validation rules |
| `.memory/domain-knowledge/index.yaml` | Trigger and implication maps |
| `.skills/hidden-requirement-discovery/skill.yaml` | Discovery skill definition |
| `packages/awp-cli/src/commands/build.js` | Prompt assembly (no model calls) |
| `packages/awp-cli/src/index.js` | CLI entry point |

---

## Finding 1: One-Command Build (Requirement 1)

**Status: PARTIAL — gap identified**

The current flow requires TWO steps:
1. `awp build "story"` → produces `.prompt.md`
2. `cat prompt.md | claude > blueprint.yaml` → manual pipe

The `awp build` command deliberately contains "no model calls" (v0.1 design decision). This is clean but adds friction.

**Gap:** No single-command path. A developer must know to pipe output manually.

**Recommendation:** Add `awp build --execute` flag that runs the assembled prompt through a configured model in one shot. Or provide a Claude Code custom slash command wrapper in `.claude/commands/workflow-builder.md` that makes it `/workflow-builder "story"` directly.

**Current adapter status:**
- `.claude/commands/workflow-builder.md` exists — delegates to prompt.md ✓
- `.opencode/command/workflow-builder.md` exists ✓
- `.cursor/commands/workflow-builder.md` exists ✓
- `.github/copilot-instructions.md` + `.github/prompts/workflow-builder.prompt.md` exist ✓

**Score: 6/10** — adapters exist but the CLI doesn't execute end-to-end.

---

## Finding 2: User Experience (Requirement 2)

**Status: MODERATE — prompt is dense, output is monolithic**

What works:
- Single-line invocation: `/workflow-builder Create Login Feature`
- Maturity levels let users control depth
- Coverage report is human-readable
- `--context` flag for brownfield (extending existing blueprints)

What doesn't:
- The output is ONE giant YAML (1240+ lines at L6). Users must navigate 28 sections to find what they need.
- No progress feedback during generation — the LLM works silently then dumps everything.
- Error mode is all-or-nothing: if validation fails, user gets a DRAFT-INVALID with a list of failed rules. No partial recovery.
- The prompt.md is 90+ lines of dense instruction — cheap models will struggle.

**Score: 5/10** — easy to invoke, hard to consume the output.

---

## Finding 3: Structure & Architecture (Requirement 3)

**Status: STRONG — well-designed spec-driven architecture**

Strengths:
- Clean separation: constitution → gates → commands → skills → templates
- 6-step pipeline with defined inputs/outputs per step (pipeline.yaml)
- Hidden-requirement discovery is systematic (trigger-map + implication closure)
- 16 machine-checkable validation rules
- 28-section schema with typed attributes
- L1-L6 maturity levels are cumulative by design
- Cross-platform adapters generated from manifest
- Constitution as supreme authority with amendment process

Weaknesses:
- The pipeline exists only as YAML/prompt specs — no programmatic execution engine. The LLM IS the engine.
- No streaming or incremental output. The pipeline is conceptual inside the prompt; the LLM may not follow steps faithfully.
- `awp build` is v0.1 and handles none of the pipeline logic itself — it just concatenates files.
- No tests for the build command or pipeline execution.
- The CLI package has only one dependency (yaml) and no test framework configured.

**Score: 8/10** — excellent spec design, weak implementation.

---

## Finding 4: Flowable MCP Integration (Requirement 4)

**Status: WEAK — no MCP integration exists**

What exists for Flowable:
- `.skills/bpmn-modeling/skill.yaml` — skill definition only (no implementation)
- `.skills/cmmn-modeling/skill.yaml` — skill definition only
- `.skills/dmn-modeling/skill.yaml` — skill definition only
- `.skills/form-modeling/skill.yaml` — skill definition only
- `.skills/root-model-selection/skill.yaml` — decision logic only
- `.templates/flowable/bpmn-process.yaml` — template only
- `.templates/flowable/cmmn-case.yaml` — template only
- `.templates/flowable/dmn-decision.yaml` — template only
- `.templates/flowable/form-definition.yaml` — template only
- `.workflows/greenfield-flowable.yaml` — 10-stage pipeline spec (no execution)
- `.workflows/brownfield-flowable.yaml` — exists but not reviewed
- `scripts/flowable-deploy-test.mjs` — deploy test script
- `.tools/bpmn-roundtrip.mjs` — BPMN roundtrip validation

What's MISSING:
- No MCP server definition for Flowable
- No Flowable REST API client
- No model deployment command
- No Flowable engine interaction (deploy, start process, complete task)
- Skills are YAML specs, not executable tools
- The greenfield pipeline (S01-S10) is pure documentation — no code executes any stage

**Score: 2/10** — great templates and specs, zero execution capability.

---

## Finding 5: Cheap Model Compatibility (Requirement 5)

**Status: PROBLEMATIC — prompt is too large for small models**

Token estimate for the assembled prompt at L6:
- prompt.md: ~2,500 tokens
- schema.yaml: ~4,500 tokens
- domain-knowledge/index.yaml: ~1,200 tokens
- Total prompt: ~8,200 tokens (input only)

The expected output (L6 blueprint) is 1,200+ lines = ~15,000+ tokens. Total context needed: ~25,000 tokens minimum.

This EXCEEDS the context window of:
- GPT-3.5 (4K/16K)
- Claude Haiku (older, 4K without extended)
- Llama 3 8B (8K)
- Many open-source models

Even if the context fits, cheap models will:
- Hallucinate validation rule compliance
- Skip sections (the prompt says "all 28" but cheap models truncate)
- Produce invalid YAML
- Fail to maintain traceability (discovery rule citations)

The L1-L6 maturity system partially addresses this (L1 = 3 sections, ~500 token output), but the prompt itself is still 8K tokens regardless of level.

**Recommendations:**
- Split the prompt: send schema incrementally (section by section) rather than all at once
- Add a `--model-tier=small|medium|large` flag that adjusts prompt verbosity
- Consider a two-pass approach: cheap model does L1-L3, expensive model does L4-L6
- The schema.yaml could be summarized (just section names + required fields) for small models

**Score: 3/10** — maturity levels help, but the base prompt is too heavy.

---

## Finding 6: Staged YAML Delivery (Requirement 6)

**Status: NOT IMPLEMENTED — monolithic output only**

The user wants 6 stages, each producing a YAML file:
1. **Initialized** — system ready, inputs validated
2. **In Progress** — generation started
3. **Generating App** — app container for all models
4. **Generating Root Models** — root BPMN/CMMN + data dictionary
5. **Generating Dependent Models** — child BPMN/CMMN models
6. **Generating Forms** — forms for user tasks

The current system produces ONE file with 28 sections. None of these stages exist as files.

This staged approach IS partially defined in the greenfield workflow (`S01-S10`), but that workflow is:
- A different pipeline (spec-driven with gates, not one-shot generation)
- Not implemented in code
- Produces different outputs (discovery brief, specs, architecture, not just YAML)

**What needs to change:**
- The output must split into independent files (root model, dependent models, forms, app definition) instead of one monolithic YAML
- Each stage should produce its own file with clear dependencies
- The "Initialized" file should contain parsed story + domain classification
- Root models (BPMN process or CMMN case) should be independent
- Dependent models reference root models
- Forms reference user tasks in root/dependent models

**Score: 1/10** — completely different output model needed.

---

## Consolidated Assessment

| Requirement | Score | Status |
|-------------|-------|--------|
| 1. One-command build | 6/10 | Adapters exist, CLI has gap |
| 2. Easy to use | 5/10 | Good invocation, monolithic output |
| 3. Good architecture | 8/10 | Excellent specs, weak implementation |
| 4. Flowable MCP ready | 2/10 | Templates only, no execution |
| 5. Cheap model compatible | 3/10 | Prompt too heavy, output too large |
| 6. Staged YAML delivery | 1/10 | Not implemented at all |
| **OVERALL** | **4.2/10** | Strong design, weak execution |

---

## Priority Recommendations

### P0 — Critical Gaps

1. **Staged output model (Req 6):** Redesign output from monolithic 28-section YAML to 6 incremental files:
   ```
   blueprints/<slug>/
   ├── 01-initialized.yaml       # Parsed story, domains, maturity level
   ├── 02-root-model.yaml        # Root BPMN/CMMN + data dictionary
   ├── 03-dependent-models.yaml  # Child BPMN/CMMN models
   ├── 04-forms.yaml             # Form definitions
   ├── 05-app.yaml               # App container/metadata
   └── 06-blueprint.yaml         # Full 28-section (L6 only, optional)
   ```

2. **Flowable MCP integration (Req 4):** Build an MCP server that:
   - Exposes Flowable REST API as MCP tools (deploy, start-process, complete-task, query)
   - Accepts the staged YAML files and converts to Flowable deployable artifacts
   - Uses familiar Flowable terminology (process definitions, case definitions, decision tables, forms)

3. **Single-command execution (Req 1):** Add `awp build --execute` that:
   - Assembles the prompt
   - Calls the configured model (Claude API, not just pipe-to-stdin)
   - Streams progress (Initialized → In Progress → ...)
   - Writes staged output files

### P1 — Important Improvements

4. **Cheap model support (Req 5):** 
   - Split schema.yaml into a summarized version for small models
   - Add `--model-tier` flag
   - Use incremental prompting (send schema section-by-section for L4+)

5. **Progress feedback (Req 2):**
   - Emit status updates per stage
   - Stream partial YAML as each stage completes
   - Allow resumption from intermediate stages

### P2 — Nice to Have

6. **Programmatic pipeline engine:** Move the 6-step pipeline from prompt.md into actual code so it's deterministic and testable, not LLM-dependent.

7. **Tests:** Add test framework to awp-cli package. Test prompt assembly, schema validation, and pipeline steps.

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Staged output breaks existing consumers of monolithic blueprint | Medium | Keep full blueprint as optional L6 output; staged is additive |
| Flowable MCP requires Flowable engine running | High | Support both local Flowable and Flowable Cloud; make engine connection optional |
| Cheap models hallucinate on large schemas even with summarization | Medium | Add schema validation as post-processing step (not LLM-dependent) |
| Splitting prompt increases total LLM calls (cost) | Low | Cheaper per-call models compensate; total token count similar |
