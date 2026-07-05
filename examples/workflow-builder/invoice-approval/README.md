# Golden Example — `/workflow-builder Invoice approval workflow with amount-based routing and four-eyes for large invoices`

This directory is a **DMN-heavy reference output** for the `/workflow-builder`
command. It proves the platform generalizes beyond the auth flagship: one line
about invoice approval in, a complete enterprise blueprint out — with a real DMN
decision table at its core.

## What it demonstrates

- **DMN amount-based routing** — a decision table `DEC-001` takes `(amount, department, vendor-risk)` and returns `(approver-role, requires-four-eyes)`. The root workflow routes on its output. This is the point of the example: routing logic lives in a versioned decision table, not in code.
- **Four-eyes for large invoices** — invoices at/above the 50,000 EUR threshold require **two distinct human identities**; the maker can never be the checker (enforced server-side, audited).
- **SLA escalation** — a sub-workflow times each approval stage on a business-hours SLA and auto-escalates on breach, bounded to 3 hops, never auto-approving.

## What happened

```
$ /workflow-builder Invoice approval workflow with amount-based routing and four-eyes for large invoices

Domains activated:     26 (3 explicit, 23 hidden/expanded)
Hidden requirements:   10 added across approvals + payments domains
Decision tables:       1 (DEC-001 approval-routing, 5 rules, FIRST hit-policy)
Validation:            26/26 rules passed
Assumptions to review: 6  -> section 'assumptions'
Written:               01-initialized.yaml … 06-forms.yaml (6 staged files)
```

Reproduce and check locally:

```bash
awp validate examples/workflow-builder/invoice-approval \
  --story "Invoice approval workflow with amount-based routing and four-eyes for large invoices"   # 26/26

awp build --aggregate --out=examples/workflow-builder/invoice-approval   # → blueprint.yaml (29 sections)

awp flowable convert examples/workflow-builder/invoice-approval          # → flowable/ (6 artifacts)
```

The user asked for **2 things** (amount-based routing, four-eyes on large
invoices). Discovery added the approval mechanics they did not spell out
(approval-chains, escalation, delegation, SLA management), the financial substance
the invoices carry (invoicing, tax, payments), and the obligations any
money-moving process incurs (SOX segregation-of-duties audit, SOC2, security,
observability, backup, disaster recovery, operations).

## The DMN decision (DEC-001)

`decision-tables` lives in stage-05 and converts to `flowable/dec-001.dmn`. It is
invoked by `WF-001.S2` and traces to `REQ-001`.

| # | amount (minor units) | vendor-risk | → approver-role | → four-eyes |
|---|----------------------|-------------|-----------------|-------------|
| R1 | ≥ 5,000,000 | high | ROLE-CFO | true |
| R2 | ≥ 5,000,000 | any | ROLE-CFO | true |
| R3 | < threshold | high | ROLE-APPROVER | true |
| R4 | ≥ 1,000,000 | standard | ROLE-APPROVER | false |
| R5 | otherwise | standard | ROLE-APPROVER | false |

Hit policy is `FIRST`: rules are evaluated top-down and the first match wins.

## Files

| File | Purpose |
|------|---------|
| `01-initialized.yaml` … `06-forms.yaml` | The staged 6-file blueprint (E5) — each stage authors its own schema sections with a `_meta` trace envelope. The **root** workflow (`WF-001`) is authored in stage-04 as `workflows: {root: …}`; the **dependent** sub-workflows (`WF-002` SLA escalation, `WF-003` four-eyes checker) and `DEC-001` are authored in stage-05. |
| [`blueprint.yaml`](blueprint.yaml) | Aggregate of the 6 staged files (`awp build --aggregate`) — all 28 schema sections + `decision-tables` in one document. |
| [`flowable/`](flowable/) | `awp flowable convert` output — 3 BPMN (1 root + 2 dependent), 1 DMN, 2 Form JSON, + `deploy-manifest.json`. |
| [`golden-tests.yaml`](golden-tests.yaml) | Assertions any `/workflow-builder` implementation must satisfy for this story, including the DMN routing and four-eyes behavior. |

## Why this is the quality bar

- **Zero placeholders** — every threshold has a number (50,000 EUR four-eyes gate, 24 business-hour stage SLA, 3-hop escalation cap, 5-minute RPO). Passes VAL-060.
- **Failures are never undefined** — all 15 workflow steps across 3 workflows define `on-failure`; 15 named exceptions with handling. Passes VAL-022.
- **100% traceable** — every hidden requirement and cross-cutting domain cites its `discovery/<domain>/<rule-id>`; `DEC-001` traces to `REQ-001` and `WF-001.S2`. Passes VAL-012.
- **Validates clean** — passes all 26 rules in [`validation-rules.yaml`](../../../.schemas/workflow-blueprint/validation-rules.yaml). Note `VAL-013` (auth-mandatory domains) does **not** apply here — this is deliberately a non-auth story. Run `awp validate <this-dir>` to check.

## Reproduce it

Open this repo in Claude Code, OpenCode, Cursor, or Copilot and run:

```
/workflow-builder Invoice approval workflow with amount-based routing and four-eyes for large invoices
```

Then check the output against `golden-tests.yaml`. The pipeline definition lives at
[`.commands/workflow-builder/`](../../../.commands/workflow-builder/).
