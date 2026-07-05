---
description: Turn a one-line user story into a complete enterprise-grade workflow blueprint YAML (28 sections, hidden-requirement discovery, maturity levels L1-L6)
agent: analyst
---

<!-- GENERATED adapter — canonical source: .commands/workflow-builder/prompt.md -->

Execute the /workflow-builder command for this story:

$ARGUMENTS

Follow the canonical execution prompt at `.commands/workflow-builder/prompt.md` exactly:

1. Run the 6-step pipeline in `.commands/workflow-builder/pipeline.yaml`
   (parse-story, classify-domains, expand-hidden, resolve-constraints,
   populate-schema, emit-and-validate).
2. Use the knowledge base at `.memory/domain-knowledge/index.yaml` and the
   skill at `.skills/hidden-requirement-discovery/skill.yaml` for hidden-domain
   discovery. Auth-related stories MUST activate the 25 mandatory domains (VAL-013).
3. Output ONE YAML blueprint conforming to `.schemas/workflow-blueprint/schema.yaml`
   at the requested maturity level (default L6 — see
   `.commands/workflow-builder/maturity-levels.yaml`).
4. Validate against all 26 rules in `.schemas/workflow-blueprint/validation-rules.yaml`,
   write to `blueprints/<slug>.yaml` (or --output), then print the coverage report.

Reference for expected depth: `examples/workflow-builder/login-registration/blueprint.yaml`.
