# 2. Domain Architecture

## 2.1 Domain Classification Model

The platform applies DDD strategic design to every input, classifying discovered domains into three categories:

| Category | Definition | Examples |
|---|---|---|
| **Core Domains** | The business capability the workflow exists to serve | Procurement, Finance, HR, CRM, Project Management, Asset Management, Contract Management, Governance, Risk Management |
| **Supporting Subdomains** | Capabilities required by the core but not differentiating | Request Management, Approval Management, Payment Management, Vendor Management, Document Management, Audit Management |
| **Generic / Platform Support Domains** | Cross-cutting enterprise concerns (Stage 2 discovery) | Security, Compliance, Audit, Monitoring, Observability, Logging, Notifications, Integration, API Management, Data Architecture, Master/Reference Data, Reporting, Analytics, AI, Knowledge Management, UI/UX, DevOps, CI/CD, Testing, Release Management, Performance, Scalability, Operations, DR, BCP, Control Environment, Governance |

## 2.2 Discovery Domain Model (Stage 1)

The Discovery Engine extracts a structured domain model from any input:

```
Input Artifact
   │
   ├── Primary Domain          (exactly one; classified against the domain ontology)
   ├── Subdomains              (one or more; mapped to subdomain taxonomy)
   ├── Bounded Contexts        (DDD strategic design; ubiquitous language per context)
   ├── Actors
   │     ├── Users / Roles / Departments
   │     ├── Internal Systems / External Systems
   │     └── AI Agents
   └── Business Objects        (Request, Invoice, Contract, Employee, Vendor,
                                Risk, Case, Project, …)
```

### Bounded Context Identification Rules

1. **Linguistic boundaries** — a term changing meaning indicates a context boundary (e.g., "Approval" in Procurement vs. HR).
2. **Ownership boundaries** — distinct accountable organizational units imply distinct contexts.
3. **Lifecycle boundaries** — business objects with independent lifecycles belong to separate contexts.
4. **Transactional boundaries** — consistency requirements define aggregate and context edges.

### Context Mapping Patterns Supported

Partnership · Shared Kernel · Customer–Supplier · Conformist · Anticorruption Layer · Open Host Service · Published Language · Separate Ways. Every inter-context relationship discovered must be assigned one of these patterns and recorded in the context map artifact.

## 2.3 Support Domain Architecture (Stage 2)

Support domains are **automatically attached** to every project. Each support domain contributes:

| Contribution | Description |
|---|---|
| Mandatory Controls | Non-negotiable rules injected into governance (e.g., audit trail on every approval) |
| Model Obligations | Flowable models the domain forces into the ecosystem (e.g., Security → `security` model; Observability → audit/event models) |
| NFR Templates | Non-functional requirements contributed to Stage 4 consolidation |
| Review Checklist Items | Items added to the Stage 5 Architecture Review Package |

### Support Domain Catalog

| Cluster | Domains | Primary Platform Obligation |
|---|---|---|
| Control & Trust | Control Environment, Governance, Security, Compliance, Audit | security model, governance rules, audit events, approval gates |
| Operational Visibility | Monitoring, Observability, Logging, Notifications | event models, channel models, notification actions |
| Connectivity | Integration, API Management | service models, channel models, event models |
| Data | Data Architecture, Master Data, Reference Data, Reporting, Analytics | dataObject, dataDictionary, query, dashboardComponent |
| Intelligence | AI, Knowledge Management | agent, knowledgeBase, variableExtractor |
| Experience | UI/UX | form, page, template, document, dashboardComponent |
| Delivery | DevOps, CI/CD, Testing, Release Management | liquibase, generation lifecycle gates, validation stage |
| Resilience | Performance, Scalability, Operations, Disaster Recovery, Business Continuity | SLA models, NFRs, operational requirements |

## 2.4 Platform's Own Bounded Contexts

The platform itself is domain-driven. Its internal bounded contexts:

| Context | Responsibility | Ubiquitous Language Anchors |
|---|---|---|
| **Ingestion Context** | Accept and normalize all input formats | Input Artifact, Source Format, Normalized Narrative |
| **Discovery Context** | Stages 1–2: domains, actors, objects, contexts | Domain, Subdomain, Actor, Business Object, Context Map |
| **Knowledge Context** | Stage 3 + registries: best practices, BMAD, Spec Kit, Skills | Practice, Control, Skill, Template, Knowledge Base |
| **Specification Context** | Stage 4: requirement consolidation | Requirement, Constraint, Assumption, Acceptance Criterion |
| **Validation Context** | Stage 5: review package and approval | Review Package, Decision Log, Open Question, Approval |
| **Mapping Context** | Stage 6: framework and Flowable mapping | Mapping Rule, Root Model, Model Graph |
| **Generation Context** | Lifecycle orchestration and YAML production | Generation Run, Phase, Model Artifact, Manifest |
| **Governance Context** | Cross-cutting controls, quality gates, audit | Gate, Control, Violation, Waiver, Audit Record |

### Internal Context Map

- Ingestion → Discovery: **Published Language** (Normalized Narrative schema).
- Discovery → Specification: **Customer–Supplier** (Specification consumes the domain model).
- Knowledge → all contexts: **Open Host Service** (registry APIs).
- Validation → Generation: **Customer–Supplier with hard gate** (Generation cannot start without an Approval artifact).
- Governance → all contexts: **Conformist enforcement** (every context conforms to governance contracts).
- Legacy BPMN/CMMN ingestion → Discovery: **Anticorruption Layer** (legacy semantics translated into the platform's domain model, never imported raw).

## 2.5 Business Object Architecture

Business objects discovered in Stage 1 become the backbone of the Data Layer mapping:

1. Each business object is assigned to exactly one bounded context (its **owning context**).
2. Objects are modeled as aggregates: root entity, value objects, invariants.
3. Each aggregate maps forward to a Flowable `dataObject`; its enumerated vocabularies map to `dataDictionary`; its retrieval patterns map to `query` models.
4. Cross-context references use identity references only (no shared mutable state), realized via service/event models in the Integration Layer.
