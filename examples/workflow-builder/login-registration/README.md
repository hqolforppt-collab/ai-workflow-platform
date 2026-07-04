# Golden Example — `/workflow-builder Create Login and Registration Feature`

This directory is the **reference output** for the flagship `/workflow-builder`
command. One line in, a complete enterprise blueprint out.

## What happened

```
$ /workflow-builder Create Login and Registration Feature

Domains activated:     27 (2 explicit, 25 hidden)
Hidden requirements:   10 added across 10 domains
Validation:            17/17 rules passed
Assumptions to review: 6  -> section 'assumptions'
Written:               01-initialized.yaml … 06-forms.yaml (6 staged files)
```

Reproduce and check locally:

```bash
awp validate examples/workflow-builder/login-registration   # 17/17 rules passed (deterministic)
awp build --aggregate examples/workflow-builder/login-registration   # → blueprint.yaml
awp flowable convert examples/workflow-builder/login-registration    # → flowable/ (6 artifacts)
```

The user asked for **2 things** (login, registration). Discovery added **25 domains
they did not mention**: password policy, account lockout, rate limiting, fraud
detection, audit trail, email verification, GDPR privacy, SOC2 compliance, logging,
monitoring, notifications, error management, observability, analytics, documentation,
testing, deployment, operations, backup, disaster recovery, and more.

## Files

| File | Purpose |
|------|---------|
| `01-initialized.yaml` … `06-forms.yaml` | The staged 6-file blueprint (E5) — each stage authors its own schema sections with a `_meta` trace envelope |
| [`blueprint.yaml`](blueprint.yaml) | Aggregate of the 6 staged files (`awp build --aggregate`) — all 28 schema sections in one document |
| [`flowable/`](flowable/) | `awp flowable convert` output — 3 BPMN (1 root + 2 dependent), 1 DMN, 2 Form JSON, + deploy-manifest.json |
| [`golden-tests.yaml`](golden-tests.yaml) | Assertions any `/workflow-builder` implementation must satisfy for this story |

## Why this is the quality bar

- **Zero placeholders** — every constraint has a number, duration, or limit (argon2id parameters, 30-minute lockouts, 5-minute RPO).
- **Failures are never undefined** — all 16 workflow steps define `on-failure`; 13 named exceptions with handling.
- **100% traceable** — every hidden requirement and cross-cutting domain cites its `discovery/<domain>/<rule-id>`.
- **Validates clean** — passes all 17 rules in [`validation-rules.yaml`](../../../.schemas/workflow-blueprint/validation-rules.yaml), including VAL-013 (25 mandatory auth domains). Run `awp validate <this-dir>` to check.

## Reproduce it

Open this repo in Claude Code, OpenCode, Cursor, or Copilot and run:

```
/workflow-builder Create Login and Registration Feature
```

Then check the output against `golden-tests.yaml`. The pipeline definition lives at
[`.commands/workflow-builder/`](../../../.commands/workflow-builder/).
