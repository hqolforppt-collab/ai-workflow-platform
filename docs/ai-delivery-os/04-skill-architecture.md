# 4. Skill Architecture

## Skill Model

A skill is the **smallest reusable unit of capability**: a self-contained, versioned instruction package with a typed input/output contract. Agents compose skills; skills never invoke agents.

```
skills/<category>/<skill-id>/
├── SKILL.md        # Platform-agnostic instructions (the "how")
├── skill.yaml      # Metadata + contract (the "what")
└── examples/       # Worked input/output examples (few-shot corpus)
```

## Skill Metadata (skill.yaml)

```yaml
skill:
  id: bpmn/decompose-process
  version: 1.3.0
  status: approved              # draft | review | approved | deprecated | retired
  owner: architecture-guild
  category: bpmn
  summary: Decompose an approved root BPMN process into dependent call-activity models.
  inputs:
    - type: root-model-yaml
      schema: templates/bpmn/process@^2
  outputs:
    - type: dependent-model-set
      schema: templates/bpmn/process@^2
  preconditions:
    - gate: G4-architecture-approval   # cannot run pre-approval
  qualityChecks:
    - all sourceRef/targetRef resolve
    - every userTask has formKey
  knowledgeRefs:
    - knowledge/flowable-assets/bpmn-field-reference.md
  telemetry:
    successCriteria: schema-valid output, zero broken traces
```

## Skill Categories

| Category | Examples |
|----------|----------|
| Discovery | stakeholder-mapping, domain-research, scope-elicitation |
| Domain Analysis | bounded-context-mapping, event-storming, glossary-extraction |
| BPMN | select-root-model, decompose-process, gateway-design |
| CMMN | case-design, milestone-planning, sentry-rules |
| DMN | decision-table-design, FEEL-expression-authoring |
| Flowable | field-name-compliance, app-packaging, form-generation |
| Security | threat-modeling, owasp-checklist, authz-design |
| Testing | test-strategy, acceptance-test-generation, regression-planning |
| Refactoring | model-simplification, dead-path-elimination |

## Skill Lifecycle

```
draft → review → approved → (active use) → deprecated → retired
```

| Transition | Trigger | Approver |
|------------|---------|----------|
| draft → review | Author submits PR | — |
| review → approved | Passes skill quality checklist | Governance gate (human) |
| approved → deprecated | Superseded by new major version | Skill owner + governance |
| deprecated → retired | No project pins it for 2 OS releases | Governance |

Deprecated skills keep working for pinned projects; new projects cannot pin them.

## Skill Registry

`skills/registry.yaml` is the single source of truth. Agents resolve skills only through the registry:

```yaml
skills:
  - id: bpmn/decompose-process
    latest: 1.3.0
    status: approved
    compatibleAgents: [architect-agent, flowable-agent]
```

## Versioning Rules

- **Patch**: instruction clarification, example additions.
- **Minor**: new optional inputs/outputs, backward-compatible behavior.
- **Major**: contract change (inputs/outputs/preconditions). Requires re-approval and migration note.

## Approval Checklist (review → approved)

1. Contract is complete and schema-referenced.
2. At least 2 worked examples exist.
3. Quality checks are machine-verifiable where possible.
4. No overlap >70% with an existing approved skill (reuse-first, P4) — else merge.
5. Knowledge references resolve.
