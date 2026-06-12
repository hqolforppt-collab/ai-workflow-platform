# 5. Generation Architecture

## 5.1 End-to-End Lifecycle

The Generation Orchestrator owns a 16-state lifecycle. States are persisted in the Project Manifest; every transition emits an audit event and re-evaluates quality gates.

```
 Initialized
     │
     ▼
 In Progress ──────────────────────────────────────────────┐
     │                                                     │
     ▼                                                     │
 Generating App                 (platform foundation root) │
     ▼                                                     │
 Generating Root Models         (BPMN / CMMN / Hybrid)     │
     ▼                                                     │
 Generating Dependent Models    (sub-processes, cases,     │  failure at any
     ▼                           actions, sequences)       │  phase → phase-
 Generating Data Layer          (dataObject, dataDict,     │  scoped retry or
     ▼                           query)                    │  rollback to last
 Generating Decision Layer      (dmn, decisionService)     │  consistent
     ▼                                                     │  checkpoint;
 Generating Integration Layer   (channel, service, event)  │  never partial-
     ▼                                                     │  publish
 Generating AI Layer            (agent, knowledgeBase,     │
     ▼                           variableExtractor)        │
 Generating Forms                                          │
     ▼                                                     │
 Generating Pages                                          │
     ▼                                                     │
 Generating Documents                                      │
     ▼                                                     │
 Generating Dashboards                                     │
     ▼                                                     │
 Validation                     (Validation Agent)         │
     ▼                                                     │
 Governance Review              (Governance Agent + gates) │
     ▼                                                     │
 Ready For Deployment ◄────────────────────────────────────┘
```

## 5.2 Phase Ordering Rationale

| Order Principle | Explanation |
|---|---|
| **App first** | The `app` model is the container; security, SLA, and user models attach to it; all other models register against it |
| **Roots before dependents** | The Root Model Strategy Engine output determines the structural spine; dependent models attach to spine nodes |
| **Data before decisions** | DMN inputs/outputs are typed against dataObject/dataDictionary definitions |
| **Integration before AI** | AI agents and extractors bind to channels, services, and events |
| **UI last among model layers** | Forms/pages/documents/dashboards reference variables, data objects, and process/case elements that must already exist |
| **Validation before governance** | Technical correctness is established before policy review, so governance reviews a sound artifact set |

## 5.3 Generation Planning

Before any state advances past `In Progress`, the Flowable Mapping Engine and Model Relationship Engine produce a **Model Plan**:

1. Inventory of every model to generate (type, name, owning bounded context).
2. Dependency graph edges (parent-child, reference, variable, event, form, data mappings).
3. Topological generation order within each phase; parallelizable branches identified.
4. Per-model template + skill bindings (which Spec Kit template and Claude skills the YAML Generator Agent uses).
5. Traceability bindings: every planned model references the requirements and decisions that justify it. **A model with no requirement linkage cannot be planned** (spec-driven invariant).

## 5.4 Checkpointing, Idempotency, Regeneration

| Mechanism | Architecture |
|---|---|
| **Checkpoints** | Each phase completion writes a consistent snapshot (manifest version + model repository version) |
| **Idempotent generation** | Generating the same plan from the same spec versions yields identical YAML (deterministic rendering, stable identifiers derived from bounded context + model name) |
| **Partial regeneration** | A changed requirement triggers impact analysis on the traceability graph; only affected models and their downstream dependents regenerate |
| **Drift protection** | Manual edits to generated artifacts are detected via content hashes; drifted artifacts are flagged for governance review before regeneration overwrites |

## 5.5 Validation Phase Architecture

The Validation Engine executes four sequential validation tiers; all must pass:

1. **Schema tier** — every YAML artifact validates against its meta-model schema version.
2. **Graph tier** — referential integrity across the model relationship graph: no dangling references, no cycles where Flowable forbids them, all parent-child links resolvable.
3. **Flowable semantic tier** — model-type-specific constraints (e.g., process start/end reachability, case plan model completeness, decision table completeness, form binding validity).
4. **Traceability tier** — every model traces to at least one approved requirement; every mandatory control maps to at least one realizing model element.

## 5.6 Governance Review Phase

- Governance Agent evaluates the full artifact set against governance rules and mandatory controls from Stages 2–3.
- Violations produce either: blocking finding (state cannot advance), or waiver request (escalated to human via Approval Gate Service).
- On pass, the Project Manifest is sealed at `Ready For Deployment`: model inventory, versions, approvals, and trace graph are frozen as the deployable baseline.
