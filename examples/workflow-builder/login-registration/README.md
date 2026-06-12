# Golden Example — `/workflow-builder Create Login and Registration Feature`

This directory is the **reference output** for the flagship `/workflow-builder`
command. One line in, a complete enterprise blueprint out.

## What happened

```
$ /workflow-builder Create Login and Registration Feature

Domains activated:     27 (2 explicit, 25 hidden)
Hidden requirements:   10 added across 10 domains
Validation:            16/16 rules passed
Assumptions to review: 6  -> section 'assumptions'
Written:               blueprint.yaml (640 lines)
```

The user asked for **2 things** (login, registration). Discovery added **25 domains
they did not mention**: password policy, account lockout, rate limiting, fraud
detection, audit trail, email verification, GDPR privacy, SOC2 compliance, logging,
monitoring, notifications, error management, observability, analytics, documentation,
testing, deployment, operations, backup, disaster recovery, and more.

## Files

| File | Purpose |
|------|---------|
| [`blueprint.yaml`](blueprint.yaml) | Full L6 blueprint — all 28 schema sections, every attribute concrete, full discovery traceability |
| [`golden-tests.yaml`](golden-tests.yaml) | 12 assertions any `/workflow-builder` implementation must satisfy for this story |

## Why this is the quality bar

- **Zero placeholders** — every constraint has a number, duration, or limit (argon2id parameters, 30-minute lockouts, 5-minute RPO).
- **Failures are never undefined** — all 16 workflow steps define `on-failure`; 13 named exceptions with handling.
- **100% traceable** — every hidden requirement and cross-cutting domain cites its `discovery/<domain>/<rule-id>`.
- **Validates clean** — passes all 16 rules in [`validation-rules.yaml`](../../../.schemas/workflow-blueprint/validation-rules.yaml), including VAL-013 (25 mandatory auth domains).

## Reproduce it

Open this repo in Claude Code, OpenCode, Cursor, or Copilot and run:

```
/workflow-builder Create Login and Registration Feature
```

Then check the output against `golden-tests.yaml`. The pipeline definition lives at
[`.commands/workflow-builder/`](../../../.commands/workflow-builder/).
