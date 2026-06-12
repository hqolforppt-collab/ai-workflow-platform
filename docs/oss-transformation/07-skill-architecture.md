# Deliverable 7 — Skill Architecture

Every capability is a versioned, reusable skill package in `.skills/`. Refines `ai-delivery-os/04-skill-architecture.md` into the open-source packaging standard.

## 1. Skill Package Anatomy

```text
.skills/bpmn-modeling/
├── skill.yaml          # Manifest (below)
├── SKILL.md            # Instructions: when to use, how to execute, constraints
├── references/         # Deep knowledge loaded on demand (Flowable BPMN field reference)
├── templates/          # Skill-local template bindings (→ .templates/bpmn/)
├── examples/           # Worked input → output pairs
└── tests/              # Golden tests: prompt fixtures + expected-output assertions
```

```yaml
# skill.yaml
id: bpmn-modeling
version: 1.2.0            # semver; breaking prompt-contract changes bump major
status: approved           # draft | review | approved | deprecated | retired
owner: "@flowable-modeling-team"
description: "Generate Flowable-compliant BPMN process models from approved specs"
agents: [architect, dev]   # who may invoke
requires_templates: [bpmn/process]
requires_knowledge: [flowable/bpmn-schema]
gates_feeding: [G2-architecture]
inputs:  { spec: ".specs/<project>/requirements.yaml" }
outputs: { model: "models/<project>/processes/*.bpmn.yaml" }
compliance:
  field_names: flowable-engine    # processDefinitionKey, taskDefinitionKey, formKey…
```

## 2. Core Skill Catalog (initial release)

| Skill | Layer | Notes |
|-------|-------|-------|
| `bpmn-modeling` | Modeling | Engine-accurate field names; root + dependent processes |
| `cmmn-modeling` | Modeling | Case lifecycle, plan items, sentries |
| `dmn-modeling` | Modeling | Decision tables, hit policies, FEEL expressions |
| `flowable-modeling` | Modeling | Orchestrates the three above + App/Form/Data Object generation; root-model selection rules |
| `ddd` | Analysis | Bounded contexts, aggregates, ubiquitous language extraction |
| `architecture` | Design | C4 views, ADR drafting, root-model dominance tests |
| `security` | Cross-cutting | OWASP/NIST research, threat modeling, gate G4 evidence |
| `testing` | Quality | Test strategy, golden tests for models, form validation tests |
| `refactoring` | Maintenance | Model refactoring with trace preservation |
| `documentation` | Delivery | Spec/architecture doc generation from templates |

## 3. Skill Lifecycle

```text
draft ──review──► approved ──supersede──► deprecated ──grace period──► retired
  ▲                  │
  └──changes requested┘
```

| Transition | Trigger | Required Evidence |
|-----------|---------|-------------------|
| draft → review | PR opened with `skill:` label | Manifest valid, SKILL.md complete, ≥1 example, ≥1 golden test |
| review → approved | 2 maintainer approvals + CI green | Golden tests pass on 2+ platforms |
| approved → deprecated | Successor approved | `superseded_by:` set; deprecation notice in registry |
| deprecated → retired | 2 minor releases elapsed | No agent references remain (CI-checked) |

## 4. Registry and Resolution

`.skills/registry.yaml` is the single lookup table (id → version → status → path). Agents resolve skills exclusively through the registry — never by direct path — so deprecation and version pinning work uniformly. **Reuse rule (constitutional):** before generating any artifact, agents MUST query the registry for an applicable approved skill; generation without a skill match is logged to `.memory/failure/` for skill-gap harvesting.

## 5. Community Skill Contributions

Skills are the primary contribution surface (virality driver). `CONTRIBUTING.md` includes a "Write your first skill" path: copy `.templates/skill-package/`, fill manifest, add golden test, open PR with `skill:` label → review workflow auto-assigns the skill owner team.
