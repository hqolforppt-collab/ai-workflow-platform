# AI-Driven Workflow Modeling Platform — Architecture

Chief Enterprise Architecture deliverable set. Scope: architecture only — no implementation, no code, no output examples.

## Deliverables

| # | Deliverable | Document |
|---|-------------|----------|
| 1 | Executive Architecture | [01-executive-architecture.md](01-executive-architecture.md) |
| 2 | Domain Architecture | [02-domain-architecture.md](02-domain-architecture.md) |
| 3 | Component Architecture | [03-component-architecture.md](03-component-architecture.md) |
| 4 | Agent Architecture | [04-agent-architecture.md](04-agent-architecture.md) |
| 5 | Generation Architecture | [05-generation-architecture.md](05-generation-architecture.md) |
| 6 | Flowable Mapping Architecture | [06-flowable-mapping-architecture.md](06-flowable-mapping-architecture.md) |
| 7 | YAML Meta-Model Architecture | [07-yaml-meta-model-architecture.md](07-yaml-meta-model-architecture.md) |
| 8 | Governance Architecture | [08-governance-architecture.md](08-governance-architecture.md) |
| 9 | Knowledge Architecture | [09-knowledge-architecture.md](09-knowledge-architecture.md) |
| 10 | Reference Architecture | [10-reference-architecture.md](10-reference-architecture.md) |

## Test Scenarios

| Scenario | Validates | Location |
|----------|-----------|----------|
| Login Page (user story → staged YAML deliverables) | Lifecycle states, domain research, data dictionary schema impact, actor classification, Flowable field-name compliance | [test-scenarios/login-page/](test-scenarios/login-page/README.md) |

## Architecture Principles (applied across all deliverables)

1. **Spec-Driven** — every artifact traces to an approved specification; nothing is generated without a spec.
2. **Domain-Driven** — bounded contexts, ubiquitous language, and context maps are first-class platform citizens.
3. **AI-Native** — agents are the primary execution units; humans govern, agents produce.
4. **Flowable-Native** — the canonical target is the Flowable Design model ecosystem; all 27 model types are supported.
5. **BMAD-Enabled** — agent personas, workflows, quality gates, and review processes are derived from the BMAD method.
6. **Claude Code Skills-Enabled** — reusable capabilities are packaged, versioned, discovered, and governed as skills.
7. **Human-in-the-Loop Governance** — Stage 5 user validation is a hard gate; no generation proceeds without approval.
8. **Everything-as-YAML** — all platform outputs are declarative YAML artifacts validated against versioned meta-model schemas.
