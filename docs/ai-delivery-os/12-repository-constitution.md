# 12. Repository Constitution Design

`constitution.md` sits at the repository root and is the **highest authority**. All agents load its digest at bootstrap; no artifact, agent, skill, or human exception may contradict it.

## Design of constitution.md

```markdown
# AIDOS CONSTITUTION

## 1. Mission
Deliver enterprise software through governed human–AI collaboration,
turning every project into reusable organizational capability.

## 2. Principles
P1. Specification before implementation — no generation without approved specs.
P2. Human approval gates — humans decide; agents prepare.
P3. Traceability — Requirement → Design → Architecture → Task → Code → Test, always.
P4. Reusable assets first — search before you create; contribute what you create.
P5. Knowledge preservation — no learning is lost between projects.

## 3. Rules
R1. Agents never approve gates.
R2. Code generation is blocked unless requirements, architecture, tasks,
    and test strategy are all approved.
R3. Mandatory human approvals: Requirements, Architecture, Data Model,
    Security, Release. These gates cannot be removed.
R4. Every artifact carries a trace block; broken traces fail gates.
R5. Sealed artifacts are immutable; changes require a recorded change request.
R6. All governance events are append-only and auditable.
R7. Failure memory is consulted before pattern memory.

## 4. Constraints
C1. All OS behavior is declared in plain text (Markdown/YAML); no platform lock-in.
C2. Well-known repository paths are stable contracts.
C3. Projects pin exact versions of every OS asset they consume.
C4. memory/session is the only unrestricted agent write area;
    projects/<id> is the only writable area during runs.
C5. No secrets, credentials, or personal data in any OS artifact.

## 5. Governance
G1. Authority order: Constitution > Policies/Standards > Gate definitions
    > Agent charters/Skill contracts > Project artifacts.
G2. Conflicts halt execution and escalate to humans.
G3. Constitutional amendments require: proposal PR + impact analysis
    + approval by the governance board + new OS minor/major version.

## 6. Quality Standards
Q1. Every gate requires a complete evidence packet.
Q2. Architecture rules of severity "error" are non-waivable without
    a recorded, expiring exception.
Q3. Scorecard thresholds are defined in governance/gates/quality-gates.yaml.

## 7. Review Requirements
V1. Reviews follow governance/gates/review-gates.yaml.
V2. Approvers must be identified humans with verifiable identity.
V3. Approval records live in projects/<id>/gates/ and are the single
    source of truth.
```

## Amendment Process

```
proposal PR → impact analysis (Governance Agent assists)
→ governance board review → approval → OS version bump → digest regeneration
```

- Amendments never apply retroactively to sealed runs.
- The constitution digest (`constitution.digest.md`) is regenerated automatically and hash-linked to the full text — agents verify the hash at bootstrap.

## Enforcement Hooks

| Mechanism | What it enforces |
|-----------|------------------|
| Bootstrap verification | Agents refuse to run without a valid, hash-verified constitution digest |
| Governance Agent audit | Rules R1–R7 at every gate |
| CI lint (repo-level) | Constraints C1–C5 (path stability, no secrets, trace blocks present) |
| Adapter contract | Every platform adapter must load the constitution digest as highest-priority rules |
