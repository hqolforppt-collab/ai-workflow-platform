# 1. Executive Architecture

## 1.1 Purpose

An AI-driven Workflow Modeling Platform that converts unstructured and semi-structured business inputs (business stories, user stories, SOPs, requirement documents, legacy BPMN/CMMN, process documentation, functional specifications) into a fully governed Flowable Design model ecosystem, expressed as validated YAML artifacts.

## 1.2 Architecture Vision

The platform is organized as **five macro-layers**, each with a clear responsibility boundary:

```
┌─────────────────────────────────────────────────────────────────┐
│  L5  EXPERIENCE & GOVERNANCE PLANE                              │
│      Review Workbench · Approval Gates · Decision Log · Audit   │
├─────────────────────────────────────────────────────────────────┤
│  L4  AGENT ORCHESTRATION PLANE                                  │
│      13 Specialized Agents · BMAD Workflows · Quality Gates     │
├─────────────────────────────────────────────────────────────────┤
│  L3  KNOWLEDGE & SPECIFICATION PLANE                            │
│      BMAD Assets · Spec Kit Templates · Claude Skills Registry  │
│      Best-Practice Knowledge Bases · Domain Ontologies          │
├─────────────────────────────────────────────────────────────────┤
│  L2  GENERATION & MAPPING PLANE                                 │
│      Generation Orchestrator · Root Model Strategy Engine       │
│      Model Relationship Engine · Flowable Mapping Engine        │
├─────────────────────────────────────────────────────────────────┤
│  L1  ARTIFACT & PERSISTENCE PLANE                               │
│      YAML Meta-Model · Project Manifest · Model Repository      │
│      Versioning · Traceability Graph                            │
└─────────────────────────────────────────────────────────────────┘
```

## 1.3 End-to-End Value Stream

```
INPUT                 ANALYSIS                 VALIDATION            GENERATION              OUTPUT
─────                 ────────                 ──────────            ──────────              ──────
Business Story   →  Stage 1 Discovery     →  Stage 5 User      →  Stage 6 Framework   →  Governed YAML
User Story          Stage 2 Support           Validation           Mapping                Flowable Model
Legacy BPMN/CMMN    Domain Discovery          (HARD GATE:          Generation             Ecosystem
SOP / Spec          Stage 3 Best Practice     human approval       Orchestration          (27 model types)
Requirement Doc     Stage 4 Requirement       required)            Lifecycle
                    Consolidation
```

The pipeline is **stage-gated**: each stage produces traceable artifacts consumed by the next; Stage 5 is a mandatory human approval gate; everything downstream of approval is fully automated agent work under governance supervision.

## 1.4 Strategic Capabilities

| Capability | Architectural Realization |
|---|---|
| Multi-format input ingestion | Input Normalization Layer with format-specific adapters (text, BPMN XML, CMMN XML, documents) |
| Domain understanding | DDD Discovery Engine + Domain Agent + domain ontology knowledge bases |
| Best-practice enforcement | Best Practice Discovery Engine backed by curated knowledge bases per domain |
| Human governance | Architecture Review Package + approval workflow + decision log |
| Full Flowable coverage | 6-layer Flowable Model Generation Framework covering all 27 model types |
| Reuse at scale | BMAD asset library, Spec Kit template engine, Claude Skill Registry |
| Determinism & auditability | Spec-driven generation, YAML meta-model validation, end-to-end traceability graph |

## 1.5 Key Architecture Decisions (Executive Summary)

| ID | Decision | Rationale |
|---|---|---|
| AD-01 | Stage-gated pipeline with one hard human gate (Stage 5) | Balances AI autonomy with enterprise governance |
| AD-02 | Agents as the only producers; humans as approvers | AI-native operating model with accountability |
| AD-03 | YAML as the single artifact format | Declarative, diff-able, reviewable, schema-validatable |
| AD-04 | Flowable Design as the exclusive modeling target | Single canonical runtime/design ecosystem; no abstraction tax |
| AD-05 | Root model selection (BPMN/CMMN/Hybrid) is rule-driven, not agent-discretionary | Predictability and governance of structural decisions |
| AD-06 | Knowledge assets (BMAD, Spec Kit, Skills) are versioned and registry-managed | Reuse, provenance, and controlled evolution |
| AD-07 | Traceability graph links input → requirement → decision → model → YAML | Full audit chain for regulated environments |

## 1.6 Stakeholder View

| Stakeholder | Interaction with Platform |
|---|---|
| Business Analyst | Supplies inputs; reviews requirement consolidation; answers open questions |
| Enterprise / Solution Architect | Approves Architecture Review Package (Stage 5 gate owner) |
| Process Owner | Validates domain model, actors, and business objects |
| Governance / Compliance Officer | Reviews governance rules, controls, audit artifacts |
| Platform Operator | Monitors generation lifecycle, manages skill/template registries |
| Flowable Developer | Consumes generated model ecosystem for deployment refinement |
