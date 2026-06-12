# 10. Reference Architecture

## 10.1 Enterprise Reference Diagram

```
                                USERS / GOVERNANCE ROLES
        Business Analyst · Process Owner · Architect · Compliance · Operator
                                       │
═══════════════════════════════════════╪══════════════════════════════════════
 EXPERIENCE & GOVERNANCE PLANE         ▼
 ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐
 │ Review       │  │ Approval Gate │  │ Decision Log │  │ Audit & Trace    │
 │ Workbench    │◄─┤ Service (G5,  │─►│ Service      │  │ Viewer           │
 │              │  │ waivers)      │  │              │  │                  │
 └──────┬───────┘  └───────┬───────┘  └──────────────┘  └────────▲─────────┘
        │ review pkg       │ approval artifact                   │ audit events
═══════╪═══════════════════╪═════════════════════════════════════╪════════════
 AGENT ORCHESTRATION PLANE │                                     │
 ┌──────▼────────────────────▼──────────────────────────────────────────────┐
 │                       AGENT ORCHESTRATOR                                 │
 │   ┌───────────────┐  ┌──────────────────┐  ┌───────────────────────┐    │
 │   │ BMAD Workflow │  │ Quality Gate     │  │ Governance Agent      │    │
 │   │ Engine        │  │ Engine (G1–G9)   │  │ (always-on observer)  │    │
 │   └───────────────┘  └──────────────────┘  └───────────────────────┘    │
 │                                                                          │
 │  Discovery │ Domain │ Business Analyst │ Architect │ Flowable Architect  │
 │  Data Arch │ Integration Arch │ UI Arch │ Security Arch │ AI Arch        │
 │  Validation Agent │ YAML Generator Agent                                 │
 └──────┬──────────────────────────────────────────────────────┬───────────┘
        │ consumes knowledge (read-only, pinned)               │ artifacts
═══════╪═══════════════════════════════════════════════════════╪════════════
 KNOWLEDGE PLANE                                               │
 ┌──────▼──────┐ ┌────────────┐ ┌───────────┐ ┌─────────────┐  │
 │ Skill       │ │ BMAD Asset │ │ Spec Kit  │ │ Best        │  │
 │ Registry    │ │ Library    │ │ Template  │ │ Practice KBs│  │
 │             │ │            │ │ Engine    │ │ + Ontologies│  │
 └─────────────┘ └────────────┘ └───────────┘ └─────────────┘  │
═══════════════════════════════════════════════════════════════╪════════════
 GENERATION & MAPPING PLANE                                    ▼
 ┌────────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
 │ Root Model     │─►│ Model        │─►│ Generation   │─►│ Validation   │
 │ Strategy Engine│  │ Relationship │  │ Orchestrator │  │ Engine       │
 │                │  │ Engine       │  │ (16 states)  │  │ (4 tiers)    │
 └────────────────┘  └──────────────┘  └──────┬───────┘  └──────────────┘
                     ┌──────────────┐         │
                     │ Flowable     │         │ YAML Generator Agent
                     │ Mapping      │         ▼
                     │ Engine       │  ┌──────────────────────────────┐
                     └──────────────┘  │ YAML ARTIFACT SET            │
                                       │ Manifest · Domains · Reqs ·  │
                                       │ Decisions · 27 model types · │
                                       │ Agents · Skills · Templates ·│
                                       │ Governance · Status          │
                                       └──────────────┬───────────────┘
═══════════════════════════════════════════════════════╪════════════════════
 ARTIFACT & PERSISTENCE PLANE                          ▼
 ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
 │ Project      │ │ Model        │ │ Traceability │ │ Schema       │
 │ Manifest     │ │ Repository   │ │ Graph Store  │ │ Registry     │
 │ Store        │ │ (versioned)  │ │              │ │              │
 └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                                       │ sealed manifest
                                       ▼
                          ┌─────────────────────────┐
                          │ EXPORT BOUNDARY         │
                          │ → Flowable Design       │
                          │   model ecosystem       │
                          └─────────────────────────┘
        ▲
        │ Normalized Narrative
 ┌──────┴───────────────────────────────────────────────────────────────────┐
 │ INGESTION LAYER — adapters: Story · User Story · Requirement Doc · SOP · │
 │ Process Doc · Functional Spec · Workflow · Legacy BPMN (ACL) ·           │
 │ Legacy CMMN (ACL) → Input Normalizer                                     │
 └──────────────────────────────────────────────────────────────────────────┘
        ▲
   INPUT ARTIFACTS
```

## 10.2 Primary Interaction Sequence (canonical run)

1. **Ingest** — input adapter normalizes the source into a Normalized Narrative with provenance spans.
2. **Discover (Stage 1)** — Discovery + Domain Agents produce domain model, contexts, actors, business objects → G1.
3. **Attach support domains (Stage 2)** — Domain + Security Architect Agents attach support-domain obligations and mandatory controls → G2.
4. **Research practices (Stage 3)** — agents fan out across Best Practice KBs per domain; emit practices, controls, constraints, rules → G3.
5. **Consolidate requirements (Stage 4)** — Business Analyst + specialist architects fill Spec Kit templates into a consolidated requirement set → G4.
6. **Validate with human (Stage 5)** — Review Workbench presents the Architecture Review Package; Approval Gate Service records the verdict → **G5 hard gate**.
7. **Map (Stage 6)** — Root Model Strategy Engine selects BPMN/CMMN/Hybrid root; Flowable Mapping + Model Relationship Engines emit the Model Plan → G6.
8. **Generate** — Generation Orchestrator drives the 16-state lifecycle; YAML Generator Agent renders all artifacts; phase gates G7 checkpoint each layer.
9. **Validate & review** — Validation Engine (G8) then Governance Review (G9).
10. **Seal** — manifest sealed `Ready For Deployment`; export boundary hands the ecosystem to Flowable Design.

## 10.3 Cross-Cutting Qualities

| Quality | Architectural Mechanism |
|---|---|
| Traceability | Graph store linking input span → requirement → decision → model → YAML; queryable end-to-end |
| Reproducibility | Pinned versions (agents, skills, templates, schemas, KBs) per run; deterministic rendering |
| Auditability | Immutable decision log + audit events on every transition and gate |
| Extensibility | New domains = new ontology + KB entries; new model types = new schema + mapping rules; no engine changes |
| Safety | Hard human gate (G5); mandatory controls with waiver-only bypass; drift detection on artifacts |
| Scalability | Stateless engines over artifact stores; parallel agent fan-out; per-layer parallel generation by dependency graph |
| Resilience | Phase checkpoints; partial regeneration via impact analysis; rollback to last consistent snapshot |

## 10.4 Architecture Compliance Statement

- All ten deliverables conform to the platform principles (spec-driven, domain-driven, AI-native, Flowable-native, BMAD-enabled, skills-enabled).
- No implementation, code, or YAML output examples are included — structure, responsibilities, interactions, governance, lifecycle, and strategy only, per mandate.
