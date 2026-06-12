# 8. Governance Architecture

## 8.1 Governance Model

Governance is a **plane, not a phase**: the Governance Agent and Quality Gate Engine observe and gate every stage, while two dedicated checkpoints (Stage 5 User Validation; Governance Review generation phase) provide formal review moments.

```
            ┌──────────────────────────────────────────────────────┐
            │                GOVERNANCE PLANE                      │
            │  Mandatory Controls · Governance Rules · Gates       │
            │  Decision Log · Waivers · Audit Trail                │
            └───────┬──────────┬──────────┬──────────┬─────────────┘
                    ▼          ▼          ▼          ▼
   Stage 1–4   Stage 5     Stage 6     Generation   Validation +
   gate per    HUMAN       mapping     phase        Governance
   stage exit  APPROVAL    gates       gates        Review (final)
               (hard gate)
```

## 8.2 Control Taxonomy

| Control Class | Source | Enforcement |
|---|---|---|
| **Mandatory Controls** | Stage 2 support domains + Stage 3 best practices | Blocking; only human waiver can bypass; waiver recorded with expiry and rationale |
| **Governance Rules** | Stage 3 outputs + enterprise policy registry | Evaluated by Governance Agent at each gate; violations block or escalate per rule severity |
| **Architecture Constraints** | Stage 3 + architecture decisions | Enforced by Mapping/Strategy engines (e.g., root model rules, integration pattern allowlists) |
| **Quality Gates** | BMAD-derived stage-exit checklists | Quality Gate Engine; all mandatory items must pass to advance |

## 8.3 Gate Catalog

| Gate | Position | Mandatory Criteria (examples of category, not exhaustive) |
|---|---|---|
| G1 Discovery Exit | After Stage 1 | Primary domain classified; all actors typed; business objects assigned to contexts; no unresolved ambiguity above threshold |
| G2 Support Domain Exit | After Stage 2 | All catalog support domains evaluated; mandatory controls attached; obligations registered |
| G3 Practice Exit | After Stage 3 | Practice pack per domain present; mandatory controls consolidated; constraints registered |
| G4 Requirement Exit | After Stage 4 | Every requirement typed, testable, and traced to source; conflicts resolved or logged as open questions |
| **G5 User Approval** | Stage 5 | **Human approval recorded. Absolute gate — no automation bypass exists by design** |
| G6 Mapping Exit | After Stage 6 | Root model decision logged; Model Plan complete; every planned model requirement-traced |
| G7 Phase Gates | Each generation phase | Phase artifacts schema-valid; checkpoint written |
| G8 Validation Gate | Validation phase | All four validation tiers pass |
| G9 Governance Review | Final phase | Zero unwaived blocking violations; manifest sealable |

## 8.4 Decision Governance

- Every architecture decision (root model selection, context boundaries, pattern choices, waiver grants) is an immutable **Decision Log** entry: context, options considered, criteria, decision, rationale, deciding agent, verifying gate, human approver where applicable.
- Decision records are YAML artifacts (Deliverable 7 family) and nodes in the traceability graph — auditors can navigate from any model element to the decisions that shaped it.

## 8.5 Stage 5 — User Validation Architecture

The Architecture Review Package assembled for human approval contains:

| Section | Content |
|---|---|
| Requirement Summary | Consolidated requirements by type, with traceability to source inputs |
| Decision Log | All decisions to date with rationale |
| Open Questions | Unresolved items requiring human input; each tagged blocking/non-blocking |
| Assumptions | All agent assumptions, each with impact-if-wrong assessment |
| Risks | Identified risks with severity and proposed mitigations |
| Domain Model | Domains, contexts, context map, actors, business objects |
| Proposed Practice Set | Recommended practices, mandatory controls, constraints |

Approval semantics: approve (unlock Stage 6) · approve-with-conditions (conditions become governance rules for the run) · reject (returns to the indicated stage with reviewer commentary attached as input).

## 8.6 Audit Architecture

- Every gate evaluation, state transition, agent artifact production, and approval emits an immutable audit event into the Traceability Graph Store.
- Audit queries supported by design: "show the full lineage of model X," "show all waivers active at sealing time," "show who approved decision Y and what it affected," "show every artifact a given skill version produced."

## 8.7 Knowledge Asset Governance

BMAD assets, Claude skills, Spec Kit templates, schemas, and agent definitions share one governance lifecycle:

`Proposed → Reviewed (quality gate) → Approved → Active → Deprecated → Retired`

Only `Active` assets are discoverable by agents; generation runs pin exact versions; deprecating an asset never breaks sealed manifests (they retain their pinned versions).
