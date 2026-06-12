# 8. Workflow Architecture

## 12-Stage Delivery Pipeline

```
Discovery → Analysis → Requirements → Architecture → Review → Approval
→ Design → Planning → Development → Testing → Validation → Release
```

Each stage is declared in `workflow/stages/NN-<stage>.yaml` with a uniform contract:

```yaml
stage:
  id: 04-architecture
  ownerAgent: architect-agent
  supportingAgents: [data-agent, security-agent]
  inputs:
    - approved requirements set (G3)
    - domain model
  outputs:
    - architecture-spec
    - adr set
    - root-model-selection record
  controls:
    - architecture-rules check (AR-*)
    - reuse lookup evidence (P4)
    - trace audit
  qualityGate: QG-architecture        # thresholds in governance/gates/quality-gates.yaml
  humanReview: G4-architecture-approval
  onFail: return-to-stage             # bounded loop, max 3, then escalate
```

## Stage Matrix

| # | Stage | Owner Agent | Key Outputs | Quality Gate | Human Gate |
|---|-------|-------------|-------------|--------------|------------|
| 1 | Discovery | Discovery Agent | Discovery report, domain map, research findings | QG-discovery | — |
| 2 | Analysis | Business Analyst + Discovery | Domain model, bounded contexts, glossary | QG-analysis | — |
| 3 | Requirements | Business Analyst Agent | BR/FR/NFR, stories, acceptance criteria | QG-requirements | **G3 (mandatory)** |
| 4 | Architecture | Architect Agent | Architecture spec, ADRs, root model selection | QG-architecture | **G4 (mandatory)** |
| 5 | Review | Governance + Security + QA Agents | Consolidated review report, findings register | QG-review | G5 (review board) |
| 6 | Approval | Governance Agent (evidence only) | Sealed baseline of specs + architecture | — | **G6 (mandatory, seals baseline)** |
| 7 | Design | Flowable + Data Agents | Model designs, data dictionary, schema impact, form designs | QG-design | G7 (incl. **data model approval — mandatory**) |
| 8 | Planning | Architect + QA Agents | Task breakdown, test strategy, trace links | QG-planning | G8 |
| 9 | Development | Flowable Agent (+ platform coder) | Models/code per approved tasks only | QG-development | — (governed by code-gen policy) |
| 10 | Testing | QA Agent | Test execution results, defect register | QG-testing | — |
| 11 | Validation | QA + Security + Governance | Acceptance evidence, **security sign-off (mandatory)**, NFR verification | QG-validation | **G11 security (mandatory)** |
| 12 | Release | Governance Agent | Release package, learning harvest, sealed run | QG-release | **G12 (mandatory)** |

## Orchestration Rules

1. **Strict forward order for gated stages** — a stage cannot start until its declared input gates are passed.
2. **Bounded rework loops** — `onFail: return-to-stage` cycles are capped (default 3); breach escalates to human with full findings.
3. **Parallelism within stages** — supporting agents with disjoint inputs run concurrently; the owner agent merges.
4. **Baseline sealing at G6** — after Approval, specs and architecture are immutable for the run; changes require a recorded change request that re-opens stages 3–6 for the affected scope only.
5. **Generation firewall before stage 9** — the Governance Agent verifies all code-gen prerequisites (deliverable 7) before Development may begin.
6. **Learning harvest at stage 12** — session memory triage and asset contribution proposals are mandatory release activities (P5).

## State Model (per run)

```
initialized → in-progress(stage-N) → gate-pending(G-N) → gate-passed | gate-failed
→ ... → released | aborted
```

Every state transition is appended to `projects/<id>/gates/run-log.yaml` with timestamp, actor (agent or human), and evidence refs — the run log is the authoritative execution record.
