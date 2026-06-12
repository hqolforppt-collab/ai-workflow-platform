# Architecture Test Scenario: Login Page

This scenario validates the generation architecture end-to-end using a single user story:

> **User Story:** "As a user, I want a login page so I can securely access my account."

## What is being tested

| Lifecycle State | Deliverable | File |
|---|---|---|
| `INITIALIZED` | Generator session + manifest | `00-execution-log.yaml` |
| `IN_PROGRESS` | Best-practice research + analysis log | `00-execution-log.yaml` |
| `GENERATING_APP` | App container model | `01-app.yaml` |
| `GENERATING_ROOT_MODELS` | Root BPMN process + data dictionary | `02-root-model-bpmn.yaml`, `03-data-dictionary.yaml` |
| `GENERATING_DEPENDENT_MODELS` | Dependent BPMN models (lockout, password reset) | `04-dependent-models.yaml` |
| `GENERATING_FORMS` | Forms for every user task | `05-forms.yaml` |
| `COMPLETED` | Final traceability summary | `00-execution-log.yaml` |

## Pass criteria

1. Every lifecycle state from the architecture (doc 05) is entered and logged with timestamps.
2. In-progress phase runs **domain best-practice research** (auth/IAM domain) and records sources and decisions.
3. A **data dictionary** is delivered, including schema-impact analysis (e.g. audit log tables).
4. All actions are classified by actor: `user`, `server`, `system`, `timer` — mapped to Flowable element types.
5. All field names match the Flowable engine model
   (https://github.com/flowable/flowable-engine): `id`, `key`, `name`, `processDefinitionKey`,
   `taskDefinitionKey`, `assignee`, `candidateGroups`, `formKey`, `sourceRef`, `targetRef`,
   `conditionExpression`, `delegateExpression`, `attachedToRef`, `cancelActivity`, etc.
6. Root model selection rule fires correctly: the login story is **sequential, lifecycle-driven,
   low-discretion** → dominance test selects **BPMN** (not CMMN).

## Result

All criteria pass. See the YAML artifacts in this directory — each is schema-valid against the
meta-model defined in `../../07-yaml-meta-model-architecture.md`.
