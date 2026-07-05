# /workflow-builder — Execution Prompt (v2.0)

You are executing the **/workflow-builder** command. The user gives you a one-line
story; you produce a staged enterprise-grade workflow blueprint across 6 incremental
YAML files covering every hidden area the user did not mention. This file is the
canonical prompt; all platform adapters (.claude/commands/, .opencode/, .cursor/commands/,
.github/prompts/) delegate here.

## Contract

- **Output schema (binding):** `.schemas/workflow-blueprint/schema.yaml` (28 sections, typed attributes)
- **Schema summary (small models):** `.schemas/workflow-blueprint/schema-summary.yaml`
- **Validation (binding):** `.schemas/workflow-blueprint/validation-rules.yaml` (26 rules)
- **Knowledge base:** `.memory/domain-knowledge/index.yaml` + one file per domain
- **Discovery skill:** `.skills/hidden-requirement-discovery/skill.yaml`
- **Maturity levels:** `.commands/workflow-builder/maturity-levels.yaml` (default **L6**)
- **Pipeline:** `.commands/workflow-builder/pipeline.yaml` — follow its 6 steps exactly
- **Stage layout:** `.commands/workflow-builder/stages.yaml` — 6 stages, per-stage schema sections
- **Model tiers:** `.commands/workflow-builder/tiers.yaml` — tier-aware prompt shaping

## Invocation

```
/workflow-builder <story>
/workflow-builder --level=L3 <story>
/workflow-builder --output=blueprints/login.yaml <story>
/workflow-builder --context=blueprints/existing.yaml <story>   # brownfield: extend, never rewrite
```

## Output format: 6 staged files

Write ONE FILE PER STAGE to `blueprints/<slug>/0N-<name>.yaml`. After writing each file,
emit a stage marker so the user sees progress:

```
[STAGE n/6] <Name> — <one-line summary>
```

The 6 stages and their files (see `.commands/workflow-builder/stages.yaml` for full details):

| Stage | File | Pipeline steps | Summary |
|-------|------|----------------|---------|
| 1 Initialized | `01-initialized.yaml` | parse-story | Parsed story + explicit domains + tier + maturity |
| 2 In Progress | `02-in-progress.yaml` | classify-domains, expand-hidden, resolve-constraints | All domains, requirements, risks, assumptions |
| 3 Generating App | `03-generating-app.yaml` | populate-schema | Actors, roles, data-model, master-data, knowledge |
| 4 Root Models | `04-root-models.yaml` | populate-schema | Root workflow, security, api, events, integrations |
| 5 Dependent Models | `05-dependent-models.yaml` | populate-schema | Sub-workflows, notifications, monitoring, logging, audit |
| 6 Forms | `06-forms.yaml` | populate-schema, emit-and-validate | Forms, pages, testing, deployment, ops, docs, governance, compliance |

## Execute the 6-step pipeline (per-stage)

### Stage 1: Initialized → `01-initialized.yaml`

1. **parse-story** — Extract intent, actors, capabilities, constraints, and negations
   ("passwordless", "no email"). Negations are user overrides and MUST be honoured.
   If the story is too ambiguous to parse, ask ONE clarifying question — never guess silently.

Write `01-initialized.yaml` with sections: `project`, `domains` (explicit + tier + maturity).

### Stage 2: In Progress → `02-in-progress.yaml`

2. **classify-domains** — Prefer the deterministic engine: `awp classify "<story>"`
   (synonym + stemming + negation matching over all 70 domains in 9 packs, with the
   implication fixpoint and baseline already applied) and use its
   `explicit`/`hidden`/`not-applicable` output verbatim. If the CLI is unavailable,
   match against the `trigger-map` in `.memory/domain-knowledge/index.yaml` yourself.
   Zero functional matches → the engine flags `matchedZero`; proceed with the
   ANY-USER-FACING baseline and note the gap. You MAY *propose* extra domains, but
   only ids that exist in the KB registry, tagged `source: proposed/<model>` —
   proposals never count toward coverage minimums; deterministic matches do.

3. **expand-hidden** — Run the hidden-requirement-discovery skill: apply the
   `implication-map` to a fixpoint, union the ANY-USER-FACING baseline (at the level's
   `hidden-discovery` setting). Tag every domain `explicit`, `hidden`, or
   `not-applicable` (with reason). Negated domains are marked not-applicable — never
   silently dropped, never forced back in.

4. **resolve-constraints** — Load `constraints` and `requirement-seeds` from each active
   domain file. Precedence: **user story > compliance > security > defaults**. Conflicts
   go to `risks`; uncertain inferences go to `assumptions` with a `validation-needed` question.

Write `02-in-progress.yaml` with sections: `requirements`, `risks`, `assumptions`.

### Stage 3: Generating App → `03-generating-app.yaml`

5. **populate-schema** (slice 1) — Fill schema sections: `actors`, `roles`, `data-model`,
   `master-data`, `knowledge`.

### Stage 4: Root Models → `04-root-models.yaml`

5. **populate-schema** (slice 2) — Fill schema sections: `workflows` (root only),
   `security`, `api`, `events`, `integrations`.

### Stage 5: Dependent Models → `05-dependent-models.yaml`

5. **populate-schema** (slice 3) — Fill schema sections: `workflows` (dependent/sub only),
   `notifications`, `monitoring`, `logging`, `audit`.

### Stage 6: Forms → `06-forms.yaml`

5. **populate-schema** (slice 4) — Fill schema sections: `forms`, `pages`, `testing`,
   `deployment`, `operations`, `support`, `documentation`, `governance`, `compliance`.

6. **emit-and-validate** — Check all 26 rules. On pass: print the coverage report.
   On fail: list the failing rules per file, mark output `status: DRAFT-INVALID`,
   and say so — never emit silently broken output.

## Per-file envelope

Every staged file begins with a `_meta` block:

```yaml
_meta:
  blueprint_id: BLU-<SLUG>
  stage: stage-0N
  produced_by: workflow-builder
  maturity_level: L6
  depends_on: [stage-0M, ...]
```

## Coverage report (always print after stage 6)

```
─────────────────────────────────────────────────────────
/workflow-builder — Coverage Report
─────────────────────────────────────────────────────────
Story:      "<story>"
Maturity:   L<N> (<Name>)
Domains:    <n> activated (<e> explicit, <h> hidden, <na> not-applicable)
Hidden reqs: <n> across <d> domains
Validation: <p>/26 rules passed
Assumptions to review: <n>
─────────────────────────────────────────────────────────
blueprints/<slug>/
  01-initialized.yaml       <n> ln
  02-in-progress.yaml       <n> ln
  03-generating-app.yaml    <n> ln
  04-root-models.yaml       <n> ln
  05-dependent-models.yaml  <n> ln
  06-forms.yaml             <n> ln
─────────────────────────────────────────────────────────
```

## Non-negotiables (from pipeline.yaml — constitutional)

- The 12 always-populated sections (security, audit, logging, monitoring, testing,
  deployment, operations, documentation, risks, assumptions, governance, compliance)
  are NEVER `not-applicable` at L4+.
- Every workflow step defines `on-failure`. Every requirement has >= 1 Given/When/Then
  acceptance criterion. Every API has >= 2 responses incl. one non-2xx. Every form field
  has `validation` + `error-message`.
- Every discovered item carries `source: discovery/<domain>/<rule-id>`.
- Concrete values everywhere — numbers, durations, limits. No TBD/TODO.

## Invariants (from pipeline.yaml — constitutional)

- **additive-only** — user intent is never removed or contradicted
- **no-silent-gaps** — every skipped domain carries a reason
- **traceability** — 100% of discovered content cites its discovery rule
- **actionability** — no placeholder values in constraints

## Tier awareness

If you are running on a small-context model (< 8K tokens), use `.schemas/workflow-blueprint/schema-summary.yaml`
instead of the full `schema.yaml`, and restrict output to the sections defined for each stage.
If maturity > L3 is requested on a small model, emit L3 with a warning:
"[WARN] Small model tier limits output to L3. Re-run with --model-tier=medium or large for L4+."

## Worked reference

The golden example lives at `examples/workflow-builder/login-registration/` — a full
L6 blueprint for "Create Login and Registration Feature" plus the golden tests any
implementation of this command must pass. When in doubt about depth or tone, match it.
