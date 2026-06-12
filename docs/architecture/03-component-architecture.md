# 3. Component Architecture

## 3.1 Component Landscape

```
┌──────────────────────────────────────────────────────────────────────────┐
│ EXPERIENCE & GOVERNANCE PLANE                                            │
│  ┌────────────────┐ ┌──────────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ Review         │ │ Approval Gate    │ │ Decision   │ │ Audit &     │ │
│  │ Workbench      │ │ Service          │ │ Log Service│ │ Trace Viewer│ │
│  └────────────────┘ └──────────────────┘ └────────────┘ └─────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│ AGENT ORCHESTRATION PLANE                                                │
│  ┌────────────────┐ ┌──────────────────┐ ┌────────────────────────────┐ │
│  │ Agent          │ │ BMAD Workflow    │ │ Quality Gate Engine        │ │
│  │ Orchestrator   │ │ Engine           │ │ (per-stage checklists)     │ │
│  └────────────────┘ └──────────────────┘ └────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│ KNOWLEDGE & SPECIFICATION PLANE                                          │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐  │
│  │ Skill    │ │ BMAD Asset│ │ Spec Kit │ │ Best Practice│ │ Domain   │  │
│  │ Registry │ │ Library   │ │ Template │ │ Knowledge    │ │ Ontology │  │
│  │          │ │           │ │ Engine   │ │ Bases        │ │ Service  │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────────┘ └──────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│ GENERATION & MAPPING PLANE                                               │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐ ┌───────────────┐  │
│  │ Generation   │ │ Root Model    │ │ Model        │ │ Flowable      │  │
│  │ Orchestrator │ │ Strategy      │ │ Relationship │ │ Mapping       │  │
│  │ (lifecycle)  │ │ Engine        │ │ Engine       │ │ Engine        │  │
│  └──────────────┘ └───────────────┘ └──────────────┘ └───────────────┘  │
│  ┌──────────────┐ ┌───────────────┐                                     │
│  │ Validation   │ │ YAML          │                                     │
│  │ Engine       │ │ Generator     │                                     │
│  └──────────────┘ └───────────────┘                                     │
├──────────────────────────────────────────────────────────────────────────┤
│ ARTIFACT & PERSISTENCE PLANE                                             │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐ ┌───────────────┐  │
│  │ Project      │ │ Model         │ │ Traceability │ │ Schema        │  │
│  │ Manifest     │ │ Repository    │ │ Graph Store  │ │ Registry      │  │
│  │ Store        │ │ (versioned)   │ │              │ │ (meta-model)  │  │
│  └──────────────┘ └───────────────┘ └──────────────┘ └───────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
        ▲
        │
┌───────┴──────────────────────────────────────────────────────────────────┐
│ INGESTION LAYER                                                           │
│  Text/Story Adapter · Document Adapter · Legacy BPMN Adapter (ACL) ·      │
│  Legacy CMMN Adapter (ACL) · Workflow Description Adapter · Normalizer    │
└───────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Component Responsibilities

### Ingestion Layer

| Component | Responsibility |
|---|---|
| Format Adapters | One adapter per input type; legacy BPMN/CMMN adapters act as Anticorruption Layers, extracting semantics (activities, gateways, stages, milestones, sentries) without importing legacy structure |
| Input Normalizer | Produces a single canonical **Normalized Narrative** artifact: structured intent, entities, actors, flow fragments, constraints, provenance references back to source spans |

### Knowledge & Specification Plane

| Component | Responsibility |
|---|---|
| Skill Registry | Catalog of Claude Code skills: metadata, versions, capability descriptors, governance status; supports discovery queries by agents |
| BMAD Asset Library | Versioned store of agents, personas, workflows, templates, instructions, quality gates, review processes extracted from BMAD |
| Spec Kit Template Engine | Template Selection Engine + Template Mapping Engine + Specification Generator; selects requirement/architecture/story/acceptance/task/spec templates by domain and stage |
| Best Practice Knowledge Bases | Per-domain curated knowledge: industry standards, architecture/design patterns, reference architectures, Flowable best practices, DDD practices, EIP, AI agent patterns, security and observability standards |
| Domain Ontology Service | Taxonomies of domains, subdomains, actor types, business object archetypes used by Discovery |

### Agent Orchestration Plane

| Component | Responsibility |
|---|---|
| Agent Orchestrator | Activates agents per stage, manages handoffs, mediates shared context, enforces agent contracts (input/output artifact types) |
| BMAD Workflow Engine | Executes BMAD-derived multi-agent workflows (analyst → architect → reviewer chains) with defined artifacts and gates |
| Quality Gate Engine | Evaluates stage-exit checklists; blocks progression on unmet mandatory criteria; routes violations to Governance Agent |

### Generation & Mapping Plane

| Component | Responsibility |
|---|---|
| Generation Orchestrator | Owns the 16-state generation lifecycle (see Deliverable 5); schedules per-layer generation; manages retries and partial regeneration |
| Root Model Strategy Engine | Applies rule-based selection logic to choose BPMN, CMMN, or Hybrid root (see Deliverable 6) |
| Model Relationship Engine | Builds the model dependency/relationship graph; resolves parent-child mappings, cross-model references, variable/event/form/data mappings |
| Flowable Mapping Engine | Maps consolidated requirements + domain model onto the 27 Flowable model types across 6 layers |
| Validation Engine | Schema validation, referential integrity across the model graph, Flowable semantic constraints, governance rule compliance |
| YAML Generator | Renders all artifacts as YAML conforming to the meta-model schemas; deterministic, idempotent output |

### Artifact & Persistence Plane

| Component | Responsibility |
|---|---|
| Project Manifest Store | The root artifact of every project: domains, requirements, decisions, model inventory, generation status |
| Model Repository | Versioned storage of every generated model definition with lineage |
| Traceability Graph Store | Graph linking source input span → requirement → decision → model → YAML artifact |
| Schema Registry | Versioned YAML meta-model schemas; the contract for all generation and validation |

### Experience & Governance Plane

| Component | Responsibility |
|---|---|
| Review Workbench | Presents the Stage 5 Architecture Review Package: requirement summary, decision log, open questions, assumptions, risks |
| Approval Gate Service | Records approvals/rejections; the only component that can unlock Stage 6 |
| Decision Log Service | Immutable record of architecture decisions with rationale and approver identity |
| Audit & Trace Viewer | End-to-end traceability queries for compliance and audit |

## 3.3 Component Interaction Contracts

All inter-component communication is **artifact-mediated**: components exchange versioned, schema-validated artifacts, never ad-hoc state. Key contracts:

| Producer → Consumer | Artifact |
|---|---|
| Ingestion → Discovery agents | Normalized Narrative |
| Discovery agents → Specification | Domain Model + Context Map + Actor/Object Catalog |
| Knowledge plane → all agents | Practice Packs, Templates, Skills (read-only, versioned) |
| Specification → Validation | Consolidated Requirement Set |
| Validation → Generation | Approval Artifact (signed, gate-unlocking) |
| Mapping engines → Generation Orchestrator | Model Plan (graph of planned models with dependencies) |
| Generation → Persistence | Model Artifacts + updated Project Manifest |
| Every component → Governance | Audit events, gate evaluations, violations |
