# 9. Human Approval Architecture

## Non-Negotiable Principle

**No autonomous bypass.** Agents prepare evidence; only identified humans approve. Every approval is a signed, immutable record.

## Mandatory Approval Set

| Gate | Subject | Approver Role | Stage |
|------|---------|---------------|-------|
| **G3** | Requirements (BR/FR/NFR, stories, acceptance criteria) | Product Owner + Business Sponsor | Requirements |
| **G4/G6** | Architecture (spec, ADRs, root model selection) | Lead/Enterprise Architect | Architecture → Approval |
| **G7-data** | Data Model (data dictionary, schema impact) | Data Owner / DBA Lead | Design |
| **G11-sec** | Security (threat model, findings closure, NFR security) | Security Officer | Validation |
| **G12** | Release | Release Manager + Product Owner | Release |

Additional configurable gates (G5 review board, G7 design, G8 planning) are defined per organization in `governance/gates/review-gates.yaml` but the five above can never be removed.

## Approval Record Format

```yaml
# projects/<id>/gates/G4-architecture-approval.yaml
gate: G4-architecture-approval
run: acme-loans/run-7
decision: approved            # approved | rejected | approved-with-conditions
approver:
  name: J. Architect
  role: lead-architect
  identity: verified-git-signature
timestamp: 2026-06-12T14:03:00Z
evidencePacket: quality/evidence/run-7/G4-packet.yaml
artifactsSealed:
  - architecture/architecture-spec.yaml@sha256:ab12…
conditions: []                # binding follow-ups if approved-with-conditions
expires: null                 # optional time-boxed approvals
```

- Records are append-only; a re-approval supersedes but never overwrites.
- `artifactsSealed` pins content hashes — any post-approval change invalidates the gate automatically.

## Evidence Packet (prepared by Governance Agent)

Each gate decision is made against a standard packet:

1. Artifacts under approval (with hashes and trace links).
2. Quality gate results (rule checks, scorecards).
3. Open findings register (with severities).
4. Reuse evidence (P4 lookup results).
5. Diff vs previously approved baseline (for re-approvals).
6. Agent recommendation (advisory only, clearly labeled).

## Decision Outcomes

| Outcome | Effect |
|---------|--------|
| Approved | Stage exits; downstream stages unlock; artifacts sealed |
| Approved with conditions | Stage exits; conditions become tracked tasks; G12 blocked until conditions closed |
| Rejected | Bounded return-to-stage loop with structured findings |

## Escalation & Exception Path

- **Conflict between agents** → Governance Agent escalates to gate approver.
- **Policy exception request** → documented exception record, approver = policy owner, mandatory expiry date, surfaced at every subsequent gate until closed.
- **Approver unavailable** → delegation must be pre-registered in `review-gates.yaml`; ad-hoc delegation is not accepted by the run log.

## Human Interface Contract

Approvals are platform-agnostic: any mechanism (PR review, signed commit, ticket sign-off) is acceptable **iff** it produces the approval record format above inside `projects/<id>/gates/`. The record in the repository is the single source of truth — not the external tool.
