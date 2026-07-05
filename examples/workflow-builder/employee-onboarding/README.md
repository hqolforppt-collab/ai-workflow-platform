# Golden Example — `/workflow-builder Employee onboarding case ...`

This directory is a **second reference output** for `/workflow-builder`. Where
[`login-registration/`](../login-registration/) proves the platform on a rigid,
sequential **BPMN process**, this example proves it generalizes to a
**CMMN-shaped case** — case management with discretionary tasks, milestones, and
human decision points, not one fixed path.

## What happened

```
$ /workflow-builder Employee onboarding case with document collection, equipment provisioning, and training

Root model:            CMMN (case)  — chosen for discretionary tasks + milestones
Domains activated:     27 (4 explicit, 23 discovered)
Hidden requirements:   10 added across 10 domains
Validation:            26/26 rules passed  (VAL-013 not-applicable — not an auth story)
Assumptions to review: 6  -> section 'assumptions'
Written:               01-initialized.yaml … 06-forms.yaml (6 staged files)
```

Reproduce and check locally:

```bash
awp validate examples/workflow-builder/employee-onboarding \
  --story "Employee onboarding case with document collection, equipment provisioning, and training"   # 26/26

awp build --aggregate --out=examples/workflow-builder/employee-onboarding    # → blueprint.yaml (29 sections)

awp flowable convert examples/workflow-builder/employee-onboarding           # → flowable/ (7 artifacts + manifest)
```

## What this demonstrates (beyond the auth example)

- **A CASE, not a process.** The root workflow `WF-001 Employee Onboarding Case`
  is CMMN (`_meta.root_model_type: CMMN`, `model-type: cmmn`). The converter emits
  `wf-001.cmmn.xml`, while its two children stay BPMN. Root-model selection follows
  [`.skills/root-model-selection`](../../../.skills/root-model-selection/skill.yaml):
  *case-driven, milestone-based, ad-hoc human work → CMMN.*
- **Required vs. discretionary tasks.** Required tasks (document collection,
  offer/policy e-sign, day-one access provisioning, checklist close) must complete;
  discretionary tasks (**equipment provisioning, badge issuance, role training**) are
  activated by a case worker on judgement via `API-003` and never block completion —
  a remote hire's case closes without them.
- **Milestones + a human decision point.** The case tracks `RECORD_OPENED →
  DOCUMENTS_COMPLETE → DAY_ONE_READY → ONBOARDING_COMPLETE` and pauses at a readiness
  review (`S8`, `FRM-003`) where *not ready* re-opens the blocking task instead of closing.
- **Document collection with retention + legal hold.** Every document carries a
  retention class and disposition date; the `DEC-001` DMN table routes disposition, and
  an active legal hold blocks deletion (`REQ-012`, `AUD-005`) regardless of the disposition date.
- **E-signature with consent + tamper-evident evidence.** The offer letter and policy
  acknowledgement are e-signed with consent captured *before* signing and an evidence
  package (SHA-256 content binding + RFC 3161 timestamp); altering a signed byte fails
  verification (`REQ-010`, eIDAS/ESIGN).

## Files

| File | Purpose |
|------|---------|
| `01-initialized.yaml` … `06-forms.yaml` | The staged 6-file blueprint (E5) — each stage authors its own schema sections with a `_meta` trace envelope |
| [`blueprint.yaml`](blueprint.yaml) | Aggregate of the 6 staged files (`awp build --aggregate`) — all 28 schema sections + `decision-tables` in one document |
| [`flowable/`](flowable/) | `awp flowable convert` output — **1 CMMN (root case)** + 2 BPMN (dependent) + 1 DMN + 3 Form JSON + `deploy-manifest.json` |
| [`golden-tests.yaml`](golden-tests.yaml) | Assertions any `/workflow-builder` implementation must satisfy for this story |

## Why this is the quality bar

- **Zero placeholders** — every constraint has a number, duration, or limit
  (6-year HR retention, 30-day training deadline, 15-minute RPO, start-date access activation).
- **Failures are never undefined** — all 17 case/workflow steps define `on-failure`;
  17 named exceptions with handling across the case and both sub-workflows.
- **100% traceable** — every hidden requirement and cross-cutting domain cites its
  `discovery/<domain>/<rule-id>`; the case and sub-workflows reference requirement ids.
- **Validates clean** — passes all 26 rules in
  [`validation-rules.yaml`](../../../.schemas/workflow-blueprint/validation-rules.yaml).
  `VAL-013` (auth-mandatory domains) is *not-applicable* here — the story is not an
  auth story — which is exactly why this example is worth having.

## Reproduce it

Open this repo in Claude Code, OpenCode, Cursor, or Copilot and run:

```
/workflow-builder Employee onboarding case with document collection, equipment provisioning, and training
```

Then check the output against `golden-tests.yaml`. The pipeline definition lives at
[`.commands/workflow-builder/`](../../../.commands/workflow-builder/).
