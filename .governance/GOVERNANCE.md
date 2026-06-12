# Governance Enforcement

Authority: [.ai/constitution.md](../.ai/constitution.md) (supreme). This document explains how the constitution is enforced structurally.

## Authority Hierarchy

```
.ai/constitution.md
  > .governance/policies/ and standards
  > .governance/gates/ (G1–G5 definitions)
  > .agents/*/charter.md and .skills/*/skill.yaml
  > project artifacts
```

Lower levels may never contradict higher levels. Conflicts halt execution and escalate to humans (Constitution G2).

## Gate Pipeline

| Gate | Stage | Approver (human) | Preparing agents |
|------|-------|------------------|------------------|
| G1 | Requirements | Product Owner | analyst, po |
| G2 | Architecture | Lead Architect | architect |
| G3 | Data Model | Data Owner | architect, dev |
| G4 | Security | Security Officer | qa, governance |
| G5 | Release | Release Manager | qa, governance |

All five gates are mandatory (Constitution R3) and cannot be removed or bypassed.

## Enforcement Mechanisms

1. **Bootstrap verification** — agents refuse to run without a valid constitution digest.
2. **Governance agent audit** — Rules R1–R7 checked at every gate; verdicts are binding.
3. **CI lint** — `.tools/validate-gates.sh` and `.tools/trace-audit.sh` run on every PR; broken trace chains fail the build.
4. **Adapter contract** — every generated adapter (CLAUDE.md, opencode.json, copilot-instructions.md, AGENTS.md) embeds the constitution digest as highest-priority rules.
5. **Drift detection** — `.tools/adapter-sync.sh --check` fails CI if generated adapters were hand-edited.

## Amendments

Constitutional amendments follow: proposal PR → impact analysis → governance board review → approval → OS version bump → digest regeneration. Amendments never apply retroactively to sealed runs.
