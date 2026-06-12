# 13. Quality Management System

## Review Types

| Review | When | Reviewed By | Checklist Source |
|--------|------|------------|------------------|
| **Architecture Review** | Stage 4–5 | Architect (human) + Security Agent + Governance Agent | `quality/reviews/architecture-review.yaml` |
| **Design Review** | Stage 7 | Lead designer/architect + Data Owner | `quality/reviews/design-review.yaml` |
| **Code Review** | Stage 9 (per task) | Human reviewer + QA Agent pre-screen | `quality/reviews/code-review.yaml` |
| **Security Review** | Stages 5 and 11 | Security Officer + Security Agent | `quality/reviews/security-review.yaml` |
| **Performance Review** | Stage 11 | QA Agent + human validator | `quality/reviews/performance-review.yaml` |

Agents pre-screen and annotate; humans decide. Every review produces findings with severity (`blocker | major | minor | observation`) into the project findings register.

## Scorecard System

Each gated stage produces a scorecard scored 0–100 across fixed dimensions:

```yaml
# quality/scorecards/architecture-scorecard.yaml (template)
scorecard:
  stage: architecture
  dimensions:
    - { name: completeness,   weight: 25, criteria: all FRs addressed, all views present }
    - { name: compliance,     weight: 25, criteria: zero AR-* errors, naming conventions }
    - { name: traceability,   weight: 20, criteria: 100% upstream links resolve }
    - { name: reuse,          weight: 15, criteria: P4 lookup evidence, assets reused vs created }
    - { name: risk,           weight: 15, criteria: open blockers=0, majors mitigated }
  threshold:
    pass: 80
    conditionalPass: 70      # allowed once per stage with recorded conditions
```

Scorecards feed the gate evidence packet; the score is advisory to humans but the **threshold is binding** on agents (below threshold = agent may not request the gate).

## Findings Register

```yaml
finding:
  id: FND-run7-018
  source: security-review
  severity: major
  statement: Login process lacks account-lockout boundary handling.
  trace: [FR-013, loanOriginationProcess]
  status: open            # open | mitigated | closed | accepted-risk
  owner: flowable-agent
  acceptedRiskApprover: null   # required if status=accepted-risk (human only)
```

- `blocker` findings fail quality gates automatically.
- `accepted-risk` requires a human approver and surfaces at every later gate until release.

## Quality Metrics (tracked per run, aggregated per OS release)

| Metric | Purpose |
|--------|---------|
| Gate first-pass rate | Health of upstream stages |
| Rework loop count per stage | Detects weak specs/skills |
| Reuse ratio (assets reused / total) | P4 effectiveness |
| Trace completeness % | P3 enforcement |
| Findings escape rate (found in validation vs earlier) | Review effectiveness |
| Learning harvest yield (promoted memories per run) | P5 effectiveness |

Metrics below OS-level targets trigger **capability improvement actions**: skill revision, template revision, or checklist strengthening — proposed via the contribution workflow.

## Continuous Improvement Loop

```
run metrics + findings → retrospective (release stage)
→ improvement proposals (skills/templates/checklists)
→ governance review → OS release
```

This closes the loop that makes the repository an *improving* organizational capability rather than a static toolkit.
