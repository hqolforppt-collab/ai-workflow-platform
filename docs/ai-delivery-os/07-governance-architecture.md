# 7. Governance Architecture

## Governance Stack

```
constitution.md                          ← supreme, amendable only via constitutional process
├── governance/policies/                 ← what is allowed (code-gen, data, AI usage)
├── governance/standards/                ← how things must be built
├── governance/architecture-rules/       ← machine-checkable constraints
├── governance/naming-conventions.md     ← identifier rules
└── governance/gates/                    ← review & quality gate definitions
```

## Code Generation Governance (Principle P1)

Code (and executable model) generation is **blocked by default**. The Governance Agent unblocks it only when ALL prerequisites are verifiably satisfied:

```yaml
# governance/policies/code-generation-policy.md (normative core)
prerequisites:
  - artifact: requirements          # BR + FR + NFR set
    gate: G3-requirements-approval
    status: approved
  - artifact: architecture-spec
    gate: G4-architecture-approval  # includes G6 overall approval
    status: approved
  - artifact: task-breakdown
    gate: G8-planning-approval
    status: approved
  - artifact: test-strategy
    gate: G8-planning-approval
    status: approved
onMissing: BLOCK                     # hard block, no agent override
onBlock:
  record: quality/evidence/<run>/generation-block-<n>.yaml
  notify: human-owner
```

There is **no autonomous bypass**. A human may grant a documented exception, which is itself a recorded governance event with expiry.

## Architecture Rules (machine-readable)

```yaml
# governance/architecture-rules/rules.yaml (excerpt)
rules:
  - id: AR-001
    statement: Every user task in a BPMN model MUST reference a formKey.
    severity: error
    checkedBy: [flowable-agent, governance-agent]
  - id: AR-014
    statement: Root model selection MUST follow dominance/lifecycle/exception tests.
    severity: error
  - id: AR-022
    statement: No model may reference an unapproved data dictionary entry.
    severity: error
```

Severity `error` rules fail gates; `warning` rules appear on scorecards.

## Naming Conventions (summary)

| Artifact | Convention | Example |
|----------|-----------|---------|
| Requirements | `BR-NNN`, `FR-NNN`, `NFR-NNN` | `FR-012` |
| ADRs | `adr-NNNN-kebab-title` | `adr-0007-root-model-bpmn` |
| Skills | `category/kebab-id` | `bpmn/decompose-process` |
| Process keys | `camelCase`, domain-prefixed | `loanOriginationProcess` |
| Gates | `G<N>-<stage>-approval` | `G4-architecture-approval` |
| Trace IDs | `TRC-<project>-<seq>` | `TRC-acme-00231` |

## Traceability Enforcement (Principle P3)

Every artifact carries a trace block:

```yaml
trace:
  id: TRC-acme-00231
  upstream: [FR-012, adr-0007]      # what this realizes
  downstream: []                    # filled as tasks/code/tests attach
```

The Governance Agent's **trace audit** runs at every gate: any artifact with broken upstream links, or any approved requirement with no downstream realization at Development stage, fails the gate.

## Review Gates vs Quality Gates

- **Review gates** (`review-gates.yaml`): WHO must look at WHAT (human roles per stage). Output: approval record.
- **Quality gates** (`quality-gates.yaml`): measurable thresholds (rule violations = 0 errors, scorecard ≥ threshold, coverage targets). Output: pass/fail evidence.

A stage exit requires **both** the quality gate pass and the review gate approval where defined (deliverables 8–9).

## Governance Agent Duties

1. Evaluate quality gates and assemble gate evidence packets.
2. Run trace audits and architecture-rule checks.
3. Enforce the code-generation policy (block/unblock).
4. Record all governance events append-only under `quality/evidence/`.
5. Escalate conflicts up the authority hierarchy; never resolve constitutional conflicts itself.
