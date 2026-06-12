# Deliverable 5 — GitHub Copilot Agent Compatibility Assessment

Copilot (Agent Mode + Coding Agent) discovers behavior through `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md` (path-scoped), `.github/prompts/*.prompt.md` (reusable prompts ≈ commands), and `.github/chatmodes/*.chatmode.md` (custom chat modes ≈ agents).

## 1. Compatibility Matrix

| Copilot Mechanism | Purpose | Repo Current State | Action |
|-------------------|---------|--------------------|--------|
| `.github/copilot-instructions.md` | Repo-wide instructions | Absent | Generate from constitution + gate rules |
| `.github/instructions/*.instructions.md` | Path-scoped rules via `applyTo` | Absent | `specs.instructions.md` (applyTo: `.specs/**`), `models.instructions.md` (Flowable field-name compliance for model YAML), `src.instructions.md` (gate precondition) |
| `.github/prompts/*.prompt.md` | Invokable prompt files (`/discover` etc. via prompt picker) | Absent | One per command, `mode: agent`, references `.commands/` |
| `.github/chatmodes/*.chatmode.md` | Persona chat modes | Absent | 6 chat modes from `.agents/` charters |
| Copilot Coding Agent (issue → PR) | Async task execution | No issue templates | Issue forms with stage labels routing to correct workflow step |

## 2. Path-Scoped Enforcement Example

`.github/instructions/src.instructions.md`:

```markdown
---
applyTo: "src/**,app/**,generated/**"
---
Before creating or modifying any file here, verify that
.specs/<active-project>/requirements.yaml, .architecture/<active-project>/architecture.yaml,
and tasks.yaml all carry `status: approved`. If not, STOP and instruct the user
to run /specify and /architect first. This rule is absolute.
```

## 3. Coding Agent Workflow Integration

1. Issue forms (Deliverable 12) carry `stage:` labels (`stage:specify`, `stage:build` …).
2. `stage:build` issues assigned to Copilot include a checklist item linking the approved spec; the PR template requires the trace chain (Story → Spec → Architecture → Task → Code → Test).
3. The gate-validation CI workflow is the hard backstop — Copilot-authored PRs cannot merge without approval artifacts.

## 4. Limitations and Mitigations

| Limitation | Mitigation |
|-----------|----------|
| No deterministic pre-write hooks | CI gate validation + branch protection on `main` |
| Instructions are advisory under heavy context pressure | Keep `copilot-instructions.md` under 60 lines; push detail to path-scoped files |
| No native memory | Prompt files instruct reading `.memory/index.yaml` at start |

## 5. Verdict

**Compatible with strong (CI-backed) enforcement.** Copilot's path-scoped instructions map naturally onto the repo's directory-as-boundary design. Effort: ~25 generated files.
