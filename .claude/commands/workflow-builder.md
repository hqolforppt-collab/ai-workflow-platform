---
description: Turn a one-line user story into a complete enterprise-grade workflow blueprint YAML (28 sections, hidden-requirement discovery, maturity levels L1-L6, 6-file staged output)
argument-hint: <user story> [--level=L1..L6] [--output=path] [--context=existing-blueprint]
---

<!-- GENERATED adapter — canonical source: .commands/workflow-builder/prompt.md -->

## Execution mode (v2.0 — staged 6-file output)

### Preferred path: awp CLI

If an `awp` CLI is available in this environment, run:

```
awp build "$ARGUMENTS" --execute --staged
```

Stream its `[STAGE n/6]` lines to the user, then show the coverage report at the end.

### Fallback: inline execution

If `awp` is not available, execute the canonical prompt at `.commands/workflow-builder/prompt.md`
yourself, writing ONE FILE PER STAGE to `blueprints/<slug>/0N-<name>.yaml`:

| Stage | File | Pipeline steps |
|-------|------|----------------|
| 1 Initialized | `01-initialized.yaml` | parse-story |
| 2 In Progress | `02-in-progress.yaml` | classify-domains, expand-hidden, resolve-constraints |
| 3 Generating App | `03-generating-app.yaml` | populate-schema (actors, roles, data-model, master-data, knowledge) |
| 4 Root Models | `04-root-models.yaml` | populate-schema (root workflow, security, api, events, integrations) |
| 5 Dependent Models | `05-dependent-models.yaml` | populate-schema (sub-workflows, notifications, monitoring, logging, audit) |
| 6 Forms | `06-forms.yaml` | populate-schema (forms, pages, testing, deployment, ops, docs, governance, compliance), emit-and-validate |

After writing each file, print `[STAGE n/6] <Name> — <one-line summary>` so the user sees progress.

Validate against all 16 rules in `.schemas/workflow-blueprint/validation-rules.yaml`.
On pass, print the coverage report. On fail, list failing rules per file with fix hints.

### Resources

- Knowledge base: `.memory/domain-knowledge/index.yaml`
- Discovery skill: `.skills/hidden-requirement-discovery/skill.yaml`
- Auth stories MUST activate the 25 mandatory domains (VAL-013)
- Stage layout: `.commands/workflow-builder/stages.yaml`
- Maturity: `.commands/workflow-builder/maturity-levels.yaml` (default L6)
- Schema: `.schemas/workflow-blueprint/schema.yaml`
- Schema summary (small models): `.schemas/workflow-blueprint/schema-summary.yaml`
- Golden reference: `examples/workflow-builder/login-registration/`
