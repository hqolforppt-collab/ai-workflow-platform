# Workflow Blueprint Schema v2.0

The output contract for the `/workflow-builder` command.

When a user types `/workflow-builder` followed by a feature story, the system emits **one YAML document** conforming to this schema: a complete enterprise workflow specification — NOT code, NOT BPMN, NOT implementation.

## Files

| File | Purpose |
|------|---------|
| `schema.yaml` | Master schema — all 28 top-level sections, every attribute typed and documented |
| `attribute-definitions.md` | Human-readable definition of every attribute, with guidance and examples |
| `validation-rules.yaml` | Machine-checkable rules: required sections, hidden-domain coverage, traceability |
| `mini-example.yaml` | A condensed filled example (login story excerpt) demonstrating correct usage |

## Core Guarantees

1. **Completeness** — Every blueprint contains all 28 sections. A section may be marked `not-applicable` only with an explicit justification; it may never be silently omitted.
2. **Hidden-requirement coverage** — Cross-cutting sections (security, audit, logging, monitoring, compliance, privacy, backup, disaster-recovery, ...) are ALWAYS populated, even when the user never mentioned them.
3. **Actionability** — Every item carries an `id`, `priority`, `status`, and enough attribute detail that a team can act on it without follow-up questions.
4. **Traceability** — Every derived item references its source: a user statement (`source: user`) or a discovery rule (`source: discovery/<domain>`).

## Section Index (28 sections)

```yaml
project:          # identity, version, maturity level, scope
domains:          # functional + cross-cutting domains discovered
requirements:     # explicit + hidden requirements, fully attributed
actors:           # humans, systems, services interacting
roles:            # permission roles + capability matrix
security:         # authn, authz, policies, controls
audit:            # audit events, retention, immutability
logging:          # log categories, levels, sinks, retention
monitoring:       # metrics, alerts, dashboards, SLOs
notifications:    # channels, templates, triggers
data-model:       # entities, attributes, relationships, retention
master-data:      # reference data, lookup tables, ownership
workflows:        # processes, steps, transitions, exceptions
forms:            # form definitions, fields, validations
pages:            # screens/pages, navigation, states
api:              # endpoints, contracts, errors, rate limits
events:           # domain events, payloads, consumers
integrations:     # external systems, protocols, contracts
testing:          # strategy, test types, golden scenarios
deployment:       # environments, pipeline, rollout strategy
operations:       # runbooks, capacity, maintenance
support:          # tiers, escalation, knowledge requirements
documentation:    # required docs, audiences, owners
knowledge:        # glossary, domain concepts, references
risks:            # risk register with mitigation
assumptions:      # explicit assumptions requiring validation
governance:       # approvals, gates, lifecycle, versioning
compliance:       # regulations (GDPR, SOC2, HIPAA...), obligations
```

## Versioning

Schema follows semver. Blueprints declare `blueprint-schema-version`. Breaking section changes bump major; new optional attributes bump minor.

## Authority

Subordinate to `.ai/constitution.md`. Registered in `.ai/manifest.yaml`. Consumed by `.commands/workflow-builder/` (Phase 3) and validated by `.tools/validate-spec.sh`.
