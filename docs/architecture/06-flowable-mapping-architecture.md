# 6. Flowable Mapping Architecture

## 6.1 Target Model Taxonomy (6 Layers, 27 Model Types)

| Layer | Model Types | Mapped From |
|---|---|---|
| **Platform Foundation** | app, security, sla, user, plugin, pluginTask, liquibase | Project scope, security requirements, SLA/NFRs, actor roles, extension needs, schema evolution needs |
| **Data** | dataObject, dataDictionary, query | Business objects (aggregates), enumerated vocabularies, retrieval/reporting requirements |
| **Integration** | channel, service, event | System actors, integration requirements, EIP pattern selections |
| **Process** | bpmn, cmmn, dmn, decisionService, action, sequence | Flow fragments, case fragments, business rules, reusable operations, orchestrated steps |
| **AI** | agent, knowledgeBase, variableExtractor | AI requirements, knowledge sources, unstructured-input extraction needs |
| **UI** | form, page, template, dashboardComponent, document | Human task interactions, navigation requirements, document outputs, reporting/analytics views |

## 6.2 Root Model Strategy

### Selection Logic (rule-driven; evaluated by the Root Model Strategy Engine, proposed by Flowable Architect Agent, verified by Governance Agent)

| Signal Category | BPMN Root | CMMN Root | Hybrid Root |
|---|---|---|---|
| Flow determinism | Predictable, ordered, repeatable sequence of activities | Unpredictable ordering; knowledge-worker discretion | Deterministic spine with discretionary segments |
| Completion semantics | Defined end states reached by flow completion | Milestone/exit-criteria driven completion | Both present |
| Activation semantics | Token-flow activation (sequence flows, gateways) | Event/condition activation (sentries, entry criteria) | Mixed |
| Lifecycle character | Transactional / straight-through processing | Long-lived case management; ad-hoc tasks; reactivation | Case envelope containing structured sub-flows |
| Actor character | System-dominated or scripted human steps | Knowledge-worker dominated | Mixed populations |
| Legacy input | Legacy BPMN supplied | Legacy CMMN supplied | Both supplied or mismatch between legacy structure and discovered semantics |

### Decision Criteria (ordered evaluation)

1. **Dominance test** — classify each discovered flow fragment as deterministic or discretionary; >70% deterministic → BPMN candidate; >70% discretionary → CMMN candidate; otherwise Hybrid candidate.
2. **Lifecycle test** — if the primary business object's lifecycle is milestone/state driven rather than flow driven, bias to CMMN.
3. **Exception-intensity test** — heavy ad-hoc exception handling around an otherwise linear flow → Hybrid (CMMN case wrapping BPMN processes).
4. **Governance override** — domain-level governance rules may mandate a root (e.g., regulated case domains require CMMN envelope for auditability of discretionary work).

### Hybrid Composition Rules

- Hybrid root is a CMMN case as envelope; BPMN processes attach as process tasks within stages.
- BPMN never embeds CMMN as root substitute; CMMN case tasks may invoke sub-cases.
- Every root selection is an Architecture Decision: logged with criteria scores, rationale, and approver linkage.

## 6.3 Model Relationship Engine

### Responsibilities

1. **Model Dependency Discovery** — derive required models from requirement and domain artifacts (e.g., human task → form; business rule → dmn; system actor → service + channel).
2. **Model Relationship Graph** — typed, directed graph; nodes = model instances, edges = relationship types below.
3. **Parent-Child Mapping** — app → all models; bpmn/cmmn → embedded/called processes, cases, actions, sequences; decisionService → dmn.
4. **Cross-Model References** — process/case → dmn (decision tasks), → service (service tasks), → agent (agent tasks), → form (user tasks), → event (catch/throw), → document (generation tasks).
5. **Variable Mapping** — canonical variable namespace per root model; variables typed against dataObject definitions; mapped across call hierarchies (in/out mappings) and into forms, decisions, extractors.
6. **Event Mapping** — event models registered on channels; mapped to BPMN catch/throw events and CMMN sentries; correlation keys typed against data layer.
7. **Form Mapping** — forms bound to user tasks, case plan human tasks, and pages; form field bindings resolve to variables/data objects.
8. **Data Mapping** — dataObject CRUD bindings on process/case data tasks; queries bound to pages and dashboard components.

### Relationship Edge Types

`contains` · `calls` · `references` · `binds-variable` · `publishes-event` · `subscribes-event` · `renders-form` · `reads-data` · `writes-data` · `invokes-decision` · `invokes-agent` · `secured-by` · `governed-by-sla`

### Graph Invariants (enforced by Validation Engine)

- Single `app` root per project; every model reachable from it.
- No orphan models (every node has ≥1 inbound `contains` or reference edge, except `app`).
- Variable bindings type-check against the Data Layer.
- Every `invokes-*` edge resolves to an existing, same-manifest-version target.

## 6.4 Layer Mapping Rules

| Source Concept | Mapping Rule |
|---|---|
| Bounded context | Candidate `app` partition or model naming namespace; one app per solution, contexts as folders/namespaces within the manifest |
| Role / department actor | `user` model entries + `security` model policies; task assignment expressions |
| System actor | `service` model (+ `channel` if asynchronous, + `event` for pub/sub) |
| AI agent actor | `agent` model + optional `knowledgeBase` + `variableExtractor` for unstructured inputs |
| Business object | `dataObject`; vocabularies → `dataDictionary`; access patterns → `query` |
| Business rule / policy table | `dmn`; orchestrated rule sets → `decisionService` |
| Reusable operation | `action`; ordered multi-step operations → `sequence` |
| Human interaction | `form` (task-level); workspace/navigation → `page` built from `template` and `dashboardComponent` |
| Generated output document | `document` model |
| SLA / NFR (timing) | `sla` model bound to processes, cases, tasks |
| Schema evolution need | `liquibase` model |
| Platform extension need | `plugin` / `pluginTask` |
