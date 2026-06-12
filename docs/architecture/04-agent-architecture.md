# 4. Agent Architecture

## 4.1 Agent Operating Model

Agents are the platform's only producers. Each agent is defined by a **BMAD-style persona** (identity, expertise, principles), an **artifact contract** (consumed artifacts → produced artifacts), a **skill set** (Claude Code skills it may invoke), and a **governance envelope** (what it may decide alone vs. what requires escalation).

```
                         ┌─────────────────────┐
                         │  Agent Orchestrator │
                         └──────────┬──────────┘
        ┌────────────────┬──────────┼───────────┬──────────────────┐
        ▼                ▼          ▼           ▼                  ▼
  DISCOVERY ring    ANALYSIS ring  ARCHITECT ring  GENERATION ring  CONTROL ring
  Discovery Agent   Business      Architect Agent  YAML Generator   Governance Agent
  Domain Agent      Analyst       Flowable Arch.   Agent            Validation Agent
                    Agent         Data Architect
                                  Integration Arch.
                                  UI Architect
                                  Security Arch.
                                  AI Architect
```

## 4.2 Agent Catalog

| Agent | Stage(s) | Consumes | Produces | Key Skills |
|---|---|---|---|---|
| **Discovery Agent** | 1 | Normalized Narrative | Primary domain, subdomains, actors, business objects (candidate) | input-analysis, entity-extraction, actor-mapping |
| **Domain Agent** | 1–2 | Discovery output, Domain Ontology | Bounded contexts, context map, support-domain attachment, ubiquitous language glossary | ddd-strategic-design, context-mapping, support-domain-catalog |
| **Business Analyst Agent** | 3–4 | Domain model, Practice Packs | Business + functional requirements, acceptance criteria, open questions, assumptions | requirement-elicitation, spec-kit-templates, gap-analysis |
| **Architect Agent** | 3–6 | Requirements, Practice Packs | Architecture requirements, architecture decisions, review package, framework mapping | architecture-decision-records, reference-architecture, trade-off-analysis |
| **Flowable Architect Agent** | 6 | Approved requirements, domain model | Root model selection input, Model Plan, Flowable layer mappings | flowable-model-taxonomy, bpmn-design, cmmn-design, dmn-design, root-model-rules |
| **Data Architect Agent** | 4, 6 | Business objects, requirements | Data requirements, dataObject/dataDictionary/query designs, master/reference data strategy | aggregate-design, data-modeling, dictionary-design |
| **Integration Architect Agent** | 4, 6 | Actors (systems), requirements | Integration requirements, channel/service/event designs, EIP pattern selection | enterprise-integration-patterns, api-design, event-design |
| **UI Architect Agent** | 6 | Requirements, forms/pages needs | form/page/template/document/dashboardComponent designs | form-design, page-composition, document-templates |
| **Security Architect Agent** | 2–6 | All artifacts | Security requirements, security model design, control mappings, threat findings | security-standards, access-control-design, compliance-controls |
| **AI Architect Agent** | 4, 6 | Requirements, AI opportunities | AI requirements, agent/knowledgeBase/variableExtractor designs | ai-agent-patterns, knowledge-base-design, extraction-design |
| **Governance Agent** | all | Every artifact + gate events | Gate verdicts, violations, waiver requests, decision log entries, audit records | governance-rules, quality-gates, audit-recording |
| **Validation Agent** | Validation phase | Generated model graph + YAML | Validation report: schema, referential integrity, Flowable semantics, governance compliance | schema-validation, graph-integrity, flowable-semantics |
| **YAML Generator Agent** | Generation phases | Model Plan + all designs | All YAML artifacts conforming to meta-model | yaml-meta-model, deterministic-rendering, manifest-assembly |

## 4.3 Collaboration Patterns

| Pattern | Usage |
|---|---|
| **Pipeline handoff** | Stage progression: each ring hands a validated artifact to the next (BMAD analyst → PM → architect pattern) |
| **Specialist consultation** | Architect Agent convenes Data/Integration/UI/Security/AI architects on demand; results merged into one decision record |
| **Reviewer pairing** | Every producing agent's artifact is checked by Governance Agent against gate checklists before handoff (BMAD review process) |
| **Escalation to human** | Any agent may raise an Open Question; unresolved blocking questions surface in the Stage 5 review package |
| **Parallel fan-out** | During Stage 3, Best Practice discovery runs per-domain in parallel; during generation, independent model layers generate concurrently per dependency graph |

## 4.4 Agent Governance Envelope

| Decision Class | Authority |
|---|---|
| Terminology, classification, drafting | Agent autonomous |
| Pattern selection within approved practice packs | Agent autonomous, logged |
| Architecture decisions (root model, context boundaries, integration style) | Agent proposes → Governance Agent verifies rule compliance → recorded in Decision Log |
| Anything contradicting a Mandatory Control | Blocked; requires human waiver via Approval Gate Service |
| Stage 5 approval | Human only — never an agent |

## 4.5 Agent Lifecycle & Versioning

- Agent definitions (persona, contract, skills, envelope) are themselves YAML artifacts in the BMAD Asset Library, versioned and governed.
- A generation run pins specific agent versions and skill versions; the pinned set is recorded in the Project Manifest for reproducibility.
- New agent versions pass through the same quality-gate review as any other knowledge asset before activation.
