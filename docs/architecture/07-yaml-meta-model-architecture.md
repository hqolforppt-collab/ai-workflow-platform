# 7. YAML Meta-Model Architecture

## 7.1 Principles

1. **Schema-first** — every artifact family has a versioned schema in the Schema Registry; generation and validation share the same schema source of truth.
2. **Layered meta-model** — common envelope → family schema → model-type schema; model-type schemas extend family schemas, never duplicate.
3. **Stable identity** — every artifact carries a deterministic identifier derived from project + bounded context + artifact name; references use identifiers, never positional or path coupling.
4. **Self-describing** — every artifact declares its schema version, provenance (producing agent + skill versions), and traceability links.
5. **Human-reviewable** — YAML structure optimized for diff review: stable key ordering, no generated noise, semantic grouping.

## 7.2 Artifact Families

```
Project Manifest  (root; one per project)
 ├── Domain Definitions          (domains, subdomains, bounded contexts,
 │                                context map, actors, business objects)
 ├── Requirements                (business, functional, NFR, architecture,
 │                                security, data, AI, operational)
 ├── Architecture Decisions      (decision records: context, options,
 │                                decision, rationale, approver, status)
 ├── Model Definitions           (the Model Plan: planned model inventory
 │                                + relationship graph)
 ├── Flowable Models             (one artifact per generated model,
 │                                27 type-specific schemas in 6 layers)
 ├── Agent Definitions           (the 13 platform agents pinned for the run)
 ├── Skill Definitions           (skills pinned for the run, with versions)
 ├── Template Definitions        (Spec Kit templates pinned for the run)
 ├── Governance Rules            (mandatory controls, gate definitions,
 │                                waivers)
 └── Generation Status           (lifecycle state, phase checkpoints,
                                  validation + governance verdicts)
```

## 7.3 Common Envelope (every artifact)

| Section | Content |
|---|---|
| Identity | id, name, artifact family, model type (if applicable), owning bounded context |
| Versioning | schema version, artifact version, content hash |
| Provenance | producing agent + version, skills used + versions, template used + version, generation run id |
| Traceability | requirement ids satisfied, decision ids implementing, source input spans (for discovery artifacts) |
| Governance | applicable controls, gate evaluations, waiver references |
| Lifecycle | status (draft, validated, approved, sealed), timestamps |

## 7.4 Schema Governance

| Concern | Architecture |
|---|---|
| Versioning | Semantic versioning per schema; manifest pins exact schema versions for a run |
| Evolution | Additive changes are minor; breaking changes are major and require a migration rule registered alongside the schema |
| Compatibility | Validation Engine validates against the pinned version; the registry can answer cross-version compatibility queries for upgrades |
| Ownership | Schema changes are governed knowledge assets — same quality-gate review as BMAD/skill assets |

## 7.5 Manifest as System of Record

- The Project Manifest is the **single navigable root**: every artifact is reachable from it; tooling (review workbench, audit viewer, deployment pipeline) reads only the manifest to discover the artifact set.
- The manifest's Generation Status section is the persisted state machine of Deliverable 5 — lifecycle state, per-phase checkpoints, and final seal.
- Sealing at `Ready For Deployment` freezes the manifest version; any subsequent change opens a new manifest version with full lineage to its predecessor.

## 7.6 Relationship to Flowable Design

- Flowable Model artifacts are **declarative model definitions**, structured to map one-to-one onto Flowable Design model semantics per type (process, case, decision, form, etc.).
- A downstream export boundary (outside this platform's generation scope) transforms sealed YAML into Flowable Design import format; the YAML remains the governed source of truth, Flowable Design artifacts are derived.
