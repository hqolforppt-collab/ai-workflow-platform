# Workflow Blueprint — Attribute Definitions

Human-readable guidance for every section of `schema.yaml`. Audience: contributors writing discovery rules, adapter authors, and reviewers validating generated blueprints.

## Conventions

- **`id` patterns** — Stable, human-readable, unique within the blueprint. Used for all cross-references (`ref`). Never renumber ids after review starts.
- **`source`** — `user` means stated in the story verbatim or by direct implication. `discovery/<domain>` means added by a hidden-requirement rule; the cited rule must exist in `.memory/domain-knowledge/`.
- **`always-populated`** — These 12 sections embody the product promise: the user gets coverage for areas they never mentioned. Generators must populate them with concrete, story-specific content — generic boilerplate fails review.

## Section Guidance

### project
`maturity-level` declares what the output contains: L1 simple requirements, L2 +hidden requirements, L3 +architecture, L4 full enterprise blueprint (default target), L5 +Flowable-ready model definitions, L6 +implementation roadmap. `out-of-scope` is mandatory — explicit exclusions prevent scope disputes.

### domains
The discovery report. `functional` lists what the story is about; `cross-cutting` lists what the story *needs* regardless of what was asked. `discovery-rule` makes every hidden inclusion auditable — a reviewer can open the cited KB file and see the trigger. `criticality: mandatory` means removing the domain requires a governance exception.

### requirements
The `hidden` list is the differentiator. Each hidden requirement must read as if a senior architect added it: concrete, justified, testable. Acceptance criteria use Given/When/Then so they translate directly into golden test scenarios.

### actors / roles
Actors are *who/what interacts* (including schedulers and external systems); roles are *what they may do*. `separation-of-duties` captures combinations that must be prevented (e.g., approver may not be requester). Every actor must appear in at least one workflow.

### security
The most scrutinized section. All five authentication sub-objects (password-policy, mfa, session, account-lockout, rate-limiting) are required for any story with user access — values must be concrete (numbers, not "appropriate limits").

### audit / logging / monitoring
Audit = immutable business record (who did what when). Logging = operational diagnostics. Monitoring = detection and alerting. Do not merge them. Every security-relevant workflow step should reference an audit event. Every alert should reference a runbook in `operations`.

### notifications
Every trigger that a human must know about (verification, lockout, password change, suspicious login). `retry-policy` is required because notification failure modes are a classic hidden requirement.

### data-model / master-data
Every attribute carries `pii` and every entity carries `classification` and `retention` — these feed `compliance.privacy` automatically. Master-data covers reference values (statuses, types) with an owner and a change process.

### workflows
The heart of the blueprint. Steps are typed; `on-failure` is mandatory on every step — undefined failure behavior is the most common real-world gap. Exceptions cover cross-step conditions (timeout, abandonment).

### forms / pages / api / events / integrations
The interface surface. Forms: every field needs validation + error message. Pages: every page lists its states (loading/error/empty are hidden requirements users forget). API: idempotency and rate-limit are required attributes, not afterthoughts. Events: name format `domain.entity.action`, delivery semantics explicit. Integrations: `failure-mode` answers "what happens when the email provider is down?"

### testing / deployment / operations / support
Operational reality. Golden scenarios mirror requirement acceptance criteria. Deployment lists configuration *names* only (never secret values). Runbooks map alerts to human action. Support's `common-issues` pre-writes the helpdesk knowledge base.

### documentation / knowledge
Each documentation item names audience + owner + update trigger, making docs a deliverable rather than an intention. Knowledge holds the glossary so terms are used consistently across the blueprint.

### risks / assumptions
Risks use likelihood x impact with a named owner. Assumptions are statements the generator could not verify — each carries `validation-needed`, a literal question to take back to stakeholders.

### governance
Links the blueprint into the repository gate system (G1–G5). `traceability` documents the source→item chain so audits can replay how the blueprint was derived.

### compliance
Regulations are evaluated explicitly: `applicable: true/false` with rationale either way — silence is not allowed. Privacy inventories PII by reference to the data model. Backup/DR carry concrete RPO/RTO values.
