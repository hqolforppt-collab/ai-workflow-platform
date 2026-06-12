# /workflow-builder — Execution Prompt

You are executing the **/workflow-builder** command. The user gives you a one-line
story; you return ONE complete enterprise-grade workflow blueprint YAML that covers
every hidden area the user did not mention. This file is the canonical prompt; all
platform adapters (.claude/commands/, .opencode/, .cursor/commands/, .github/prompts/)
delegate here.

## Contract

- **Output schema (binding):** `.schemas/workflow-blueprint/schema.yaml` (28 sections, typed attributes)
- **Validation (binding):** `.schemas/workflow-blueprint/validation-rules.yaml` (16 rules)
- **Knowledge base:** `.memory/domain-knowledge/index.yaml` + one file per domain
- **Discovery skill:** `.skills/hidden-requirement-discovery/skill.yaml`
- **Maturity levels:** `.commands/workflow-builder/maturity-levels.yaml` (default **L6**)
- **Pipeline:** `.commands/workflow-builder/pipeline.yaml` — follow its 6 steps exactly

## Invocation

```
/workflow-builder <story>
/workflow-builder --level=L3 <story>
/workflow-builder --output=blueprints/login.yaml <story>
/workflow-builder --context=blueprints/existing.yaml <story>   # brownfield: extend, never rewrite
```

## Execute the 6-step pipeline

1. **parse-story** — Extract intent, actors, capabilities, constraints, and negations
   ("passwordless", "no email"). Negations are user overrides and MUST be honoured.
   If the story is too ambiguous to parse, ask ONE clarifying question — never guess silently.

2. **classify-domains** — Match the story against the `trigger-map` in
   `.memory/domain-knowledge/index.yaml`. Collect explicit functional domains.
   Zero matches → treat as a generic feature; proceed with the ANY-USER-FACING baseline only.

3. **expand-hidden** — Run the hidden-requirement-discovery skill: apply the
   `implication-map` to a fixpoint, union the ANY-USER-FACING baseline (at the level's
   `hidden-discovery` setting). Tag every domain `explicit`, `hidden`, or
   `not-applicable` (with reason). Negated domains are marked not-applicable — never
   silently dropped, never forced back in.

4. **resolve-constraints** — Load `constraints` and `requirement-seeds` from each active
   domain file. Precedence: **user story > compliance > security > defaults**. Conflicts
   go to `risks`; uncertain inferences go to `assumptions` with a `validation-needed` question.

5. **populate-schema** — Fill all 28 sections (per the requested maturity level; L6 = all).
   Non-negotiables:
   - The 12 always-populated sections (security, audit, logging, monitoring, testing,
     deployment, operations, documentation, risks, assumptions, governance, compliance)
     are NEVER `not-applicable` at L4+.
   - Every workflow step defines `on-failure`. Every requirement has >= 1 Given/When/Then
     acceptance criterion. Every API has >= 2 responses incl. one non-2xx. Every form field
     has `validation` + `error-message`.
   - Every discovered item carries `source: discovery/<domain>/<rule-id>`.
   - Concrete values everywhere — numbers, durations, limits. No TBD/TODO.

6. **emit-and-validate** — Check all 16 rules. On pass: write the file
   (default `blueprints/<slug>.yaml`) and print the coverage report. On fail: list the
   failing rules, save as `status: DRAFT-INVALID`, and say so — never emit silently
   broken output.

## Coverage report (always print after the file)

```
Domains activated:    <n> (<e> explicit, <h> hidden, <na> not-applicable)
Hidden requirements:  <n> added across <d> domains
Validation:           <passed>/16 rules passed
Assumptions to review: <n>  -> section 'assumptions'
Written:              <path> (<lines> lines)
```

## Invariants (from pipeline.yaml — constitutional)

- **additive-only** — user intent is never removed or contradicted
- **no-silent-gaps** — every skipped domain carries a reason
- **traceability** — 100% of discovered content cites its discovery rule
- **actionability** — no placeholder values in constraints

## Worked reference

The golden example lives at `examples/workflow-builder/login-registration/` — a full
L6 blueprint for "Create Login and Registration Feature" plus the golden tests any
implementation of this command must pass. When in doubt about depth or tone, match it.
