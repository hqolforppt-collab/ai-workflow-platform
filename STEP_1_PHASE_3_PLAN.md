# Step 1: Phase 3 — Complete Templates Library

**Objective:** Materialize 6 missing template files so `.templates/registry.yaml` fully resolves (12 of 12).

## Gap Analysis

Registry declares:
- ✅ 6 approved + on disk: business-requirement, functional-requirement, user-story, adr, architecture-spec, bpmn-process
- ❌ 6 draft + missing: form-definition, cmmn-case, dmn-decision, data-dictionary, threat-model, test-strategy

## Deliverables

All templates follow the same structure as existing ones (YAML with fields, instructions, examples).

### 1. `.templates/flowable/form-definition.yaml` (draft)
- Purpose: Flowable form model spec (FormLayout, FormField, validation rules)
- Fields: id, title, description, sections, fields, validations, styling
- Example: Login form with 2 fields + CAPTCHA

### 2. `.templates/flowable/cmmn-case.yaml` (draft)
- Purpose: Case Management Model Notation (stages, milestones, discretionary tasks)
- Fields: id, name, stages, milestones, tasks, decision points
- Example: Customer onboarding case

### 3. `.templates/flowable/dmn-decision.yaml` (draft)
- Purpose: Decision Model and Notation (decision tables, rules, hit policies)
- Fields: id, name, inputs, outputs, rules, hitPolicy, default
- Example: Loan approval decision table

### 4. `.templates/data/data-dictionary.yaml` (draft)
- Purpose: Enterprise data glossary (entities, attributes, relationships, lineage)
- Fields: entities, attributes, relationships, classifications, stewardship
- Example: Customer entity with contact, address, account attributes

### 5. `.templates/security/threat-model.yaml` (draft)
- Purpose: STRIDE threat modeling (threats, assets, mitigations, controls)
- Fields: title, scope, assets, threatActors, threats, mitigations, riskMatrix
- Example: Login API threats

### 6. `.templates/testing/test-strategy.yaml` (draft)
- Purpose: Test strategy (coverage levels, test types, entry/exit criteria)
- Fields: scope, pyramid, unitTests, integrationTests, e2eTests, performance, security
- Example: Full-stack testing for microservice

## Task Breakdown

1. Create form-definition.yaml (25 lines)
2. Create cmmn-case.yaml (25 lines)
3. Create dmn-decision.yaml (25 lines)
4. Create data-dictionary.yaml (28 lines)
5. Create threat-model.yaml (30 lines)
6. Create test-strategy.yaml (30 lines)
7. Commit + push (single commit)

## Success Criteria

- All 6 files exist in `.templates/`
- Registry entry `path` points to actual file
- Each template has: `id`, `title`, `description`, `usage`, `fields`, `example`
- All files pass YAML validation (`yamllint`)
- Git status shows 6 new files + clean working tree

---

**Next steps after Step 1:**
- Step 2: Phase 4 — 14 commands in `.commands/`
- Step 3: Phase 5 — `examples/login-page/` (full featured example with gates, BPMN, evidence)
