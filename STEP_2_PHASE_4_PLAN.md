# Step 2: Phase 4 — Complete Commands Library

**Objective:** Materialize 10 missing command specs so `.commands/registry.yaml` fully resolves (11 of 11).

## Gap Analysis

Registry declares 11 commands; only 1 file exists (awp-init). Missing:
- ✅ 1 approved + on disk: awp-init
- ❌ 10 missing: discover, specify, architect, generate, gate, validate-spec, lint-gates, audit-trace, adapter-sync, memory-sync

## Command Specifications

Each command follows YAML structure: `id`, `name`, `description`, `purpose`, `usage`, `inputs`, `outputs`, `lifecycle`.

### 1. `discover` — AI agent discovery
Usage: `awp discover --model=bpmn --depth=full`
Purpose: Scan repo to discover existing skills, templates, models, agents
Outputs: JSON registry of discovered artifacts

### 2. `specify` — Requirements + user story generation
Usage: `awp specify --template=user-story --stakeholder=pm`
Purpose: Guide requirements elicitation using templates
Outputs: .yml requirement file in docs/

### 3. `architect` — Architecture design assistant
Usage: `awp architect --component=payments --style=ddd`
Purpose: Generate architecture specs and ADRs
Outputs: ADR file + architecture-spec.yaml

### 4. `generate` — Code/model generation
Usage: `awp generate --from=spec.yaml --to=bpmn`
Purpose: Transform specs into BPMN, forms, migrations
Outputs: Generated .bpmn, .form, .sql files

### 5. `gate` — Gate evidence collection
Usage: `awp gate --gate=G2-architecture --approve`
Purpose: Collect + verify evidence for each governance gate
Outputs: Gate approval + trace link

### 6. `validate-spec` — Spec format validation
Usage: `awp validate-spec docs/requirements/login.yaml`
Purpose: Check specs against constitutional rules
Outputs: Pass/Fail with violations

### 7. `lint-gates` — Gate consistency check
Usage: `awp lint-gates --all`
Purpose: Verify gate assignments, transitions, evidence completeness
Outputs: Violations report

### 8. `audit-trace` — Traceability audit
Usage: `awp audit-trace --requirement=REQ-001 --depth=full`
Purpose: Trace requirement → spec → design → code → test
Outputs: Trace tree with links

### 9. `adapter-sync` — Adapter generator
Usage: `awp adapter-sync --platform=claude --check`
Purpose: Generate/validate adapters from .ai/manifest.yaml
Outputs: CLAUDE.md, opencode.json, etc. or violations

### 10. `memory-sync` — Memory tier sync
Usage: `awp memory-sync --tier=decision --import=/path/to/logs.txt`
Purpose: Sync memory tiers with session/decision logs
Outputs: Updated .memory/ structure

## Deliverables

10 command files (`.commands/<id>/command.yaml`), ~25–35 lines each.
All reference proper: inputs, outputs, exit codes, examples.

## Commit Strategy

Single commit for all 10 commands + push.

---

**Next:** Step 3 — Build flagship `examples/login-page/` example
