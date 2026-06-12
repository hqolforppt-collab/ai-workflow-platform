# 3. Agent Architecture

## Agent Model

An agent is a **role charter, not a process**. It is defined entirely by declarative files (`charter.md`, `agent.yaml`, `collaboration.yaml`) so any AI platform can instantiate it.

```yaml
# agents/<agent-id>/agent.yaml (contract schema)
agent:
  id: architect-agent
  version: 1.1.0
  charter: charter.md
  inputs:        # artifact types this agent consumes
    - functional-requirements
    - nfr
    - domain-model
  outputs:       # artifact types this agent produces
    - architecture-spec
    - adr
  skills:        # skills it is licensed to invoke (from skills/registry.yaml)
    - domain-analysis/*
    - flowable/select-root-model@^2
  memoryAccess:
    read:  [strategic, domain, project, decisions, patterns, failures]
    write: [session, decisions]
  contextProfile: architecture     # see context/prioritization.yaml
  gates:                           # gates this agent's outputs feed
    - G4-architecture-approval
  authority:
    mayApprove: false              # agents NEVER approve gates (P2)
    mayGenerateCode: false
```

## Agent Roster

| Agent | Responsibilities | Key Inputs | Key Outputs | Memory Writes |
|-------|------------------|-----------|-------------|---------------|
| **Discovery Agent** | Elicit scope, stakeholders, domains; run domain research | User story / brief | Discovery report, domain map | session, domain (proposed) |
| **Business Analyst Agent** | BRs, FRs, user stories, acceptance criteria | Discovery report | Specification set | session |
| **Architect Agent** | Architecture spec, root model selection, ADRs | Specs, domain model | Architecture spec, ADRs | session, decisions |
| **Flowable Agent** | BPMN/CMMN/DMN/form model generation (Flowable field names) | Approved architecture | Model YAML hierarchy | session |
| **Data Agent** | Data dictionary, schema impact, migrations | Specs, models | Data dictionary, schema-impact report | session |
| **Security Agent** | Threat model, security NFR validation, OWASP/NIST checks | Specs, architecture, models | Security review, findings | session, failures (proposed) |
| **QA Agent** | Test strategy, test cases, validation evidence | Specs, models, code | Test strategy, test suites, scorecards | session |
| **Governance Agent** | Gate enforcement, traceability audit, policy compliance | All artifacts | Gate evidence, audit report, block/pass verdicts | session |

## Hard Boundaries

1. **No agent approves a gate.** Agents prepare gate evidence; humans approve (P2).
2. **No agent writes outside its declared `memoryAccess.write`.**
3. **No agent invokes a skill not licensed in its `agent.yaml`.**
4. **Flowable Agent cannot run before G4 approval; no code/model generation without approved prerequisites** (P1, enforced by Governance Agent).
5. **Governance Agent verdicts are binding** on all other agents; only a human can override, and the override is recorded.

## Collaboration Protocol

Agents collaborate via **artifact handoffs**, never shared mutable state.

```yaml
# agents/<agent-id>/collaboration.yaml (excerpt)
handoffs:
  - to: architect-agent
    artifact: functional-requirements
    contract:
      schema: specifications/_schema/functional-requirement.yaml
      completeness: all acceptance criteria present
      traceability: each FR links >=1 BR
    onReject: return-with-findings   # structured rejection, max 3 cycles, then escalate to human
```

- **Handoff = artifact + context packet** (see deliverable 10). The receiving agent validates the contract before accepting.
- **Rejection loops are bounded** (default 3) to prevent infinite agent ping-pong; breach escalates to human.
- **Parallelism**: agents whose inputs are disjoint may run concurrently (e.g., Data Agent and Security Agent both consume the approved architecture).

## Agent Lifecycle

`proposed → reviewed → approved → active → deprecated → retired`

Charter changes follow SemVer: breaking I/O contract changes bump major and require governance approval. Projects pin agent versions in their manifest.
