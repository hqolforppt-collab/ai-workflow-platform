# 14. Enterprise Reference Operating Model

## Operating Model Overview

AIDOS operates at three horizons:

| Horizon | Cadence | Activity |
|---------|---------|----------|
| **Run** | Per project | Execute the 12-stage pipeline with agents + human gates |
| **Capability** | Per OS release | Curate skills, templates, memories, knowledge; ship OS versions |
| **Enterprise** | Quarterly/annual | Govern standards, domains, strategic memory; measure portfolio outcomes |

## Roles

| Role | Horizon | Responsibilities |
|------|---------|------------------|
| Product Owner | Run | Owns story intake; approves G3, co-approves G12 |
| Lead Architect | Run | Approves G4/G6; owns ADRs |
| Data Owner | Run | Approves data model (G7-data) |
| Security Officer | Run | Approves security gate (G11-sec) |
| Release Manager | Run | Approves G12 |
| Delivery Lead | Run | Operates the pipeline, manages escalations |
| Capability Curator(s) | Capability | Skill/template/knowledge approval; memory promotion curation |
| Governance Board | Enterprise | Constitution amendments, policy ownership, OS release approval |

One person may hold several roles in small organizations, but an approver may never approve their own authored artifact.

## Project Instantiation Playbook

1. **Fork/branch** the OS repo (or create `projects/<id>/` workspace).
2. **Pin versions** — generate `project-manifest.yaml` from current OS release.
3. **Select domain memory** — attach relevant `memory/domain/*` collections.
4. **Configure gates** — instantiate `review-gates.yaml` approver names (mandatory 5 cannot be removed).
5. **Choose platform adapter(s)** — one manifest, any platform.
6. **Run the pipeline** — stages 1–12 with gates.
7. **Release + harvest** — seal the run, promote learnings, propose asset contributions.

## Contribution Workflow (capability growth)

```
project run produces candidate asset (skill/template/pattern/playbook)
→ contribution PR to OS repo
→ Capability Curator review (quality checklists, dedup vs registry)
→ governance gate → merged → next OS release
```

Every run is contractually expected to attempt at least one contribution (P5); zero-contribution runs are flagged in portfolio metrics.

## Multi-Project & Portfolio View

- Projects are isolated under `projects/` (or separate repos pinned to an OS release) — no cross-project artifact references.
- Cross-project knowledge flows **only** through curated memory and knowledge tiers, never via direct file copying.
- Portfolio dashboard aggregates run metrics (deliverable 13) per OS release to show capability trend: reuse ratio up, rework down, gate first-pass up.

## Adoption Roadmap

| Phase | Scope | Exit Criteria |
|-------|-------|---------------|
| 1. Pilot | 1 project, core agents (BA, Architect, Flowable, Governance), 5 mandatory gates | Full trace chain demonstrated end-to-end |
| 2. Standardize | 2–3 projects, full agent roster, scorecards live | Gate first-pass rate measured; first contributed skills merged |
| 3. Scale | Portfolio-wide, multiple platforms via adapters | Reuse ratio > 50%; OS release cadence established |
| 4. Optimize | Continuous improvement loop driving OS releases | Metrics-driven skill/template evolution |

## What Makes This Reusable Capability (not a project)

1. **Everything is an asset** — agents, skills, templates, memories, knowledge are versioned and registry-indexed.
2. **Projects consume pinned versions** — reuse is reproducible, not copy-paste.
3. **Learnings are harvested by contract** — P5 is a release-stage obligation, not a hope.
4. **Platform independence** — adapters isolate the OS from tooling churn; the capability outlives any single AI platform.
5. **Constitutional stability** — the authority hierarchy protects the system from erosion as teams and tools change.
