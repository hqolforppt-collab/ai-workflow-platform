# Deliverable 10 — Template Architecture

The repository is template-first: **no AI output is generated without template selection.** Templates live in `.templates/` with a registry, schemas, and per-platform elicitation support.

## 1. Template Package Anatomy

```text
.templates/bpmn/
├── template.yaml        # Manifest: id, version, status, schema ref, used-by
├── process.tmpl.yaml    # The template body with placeholders + guidance blocks
├── schema.json          # JSON Schema the filled output must validate against
├── guidance.md          # Elicitation guidance (BMAD [[LLM:]] markers embedded)
└── examples/            # ≥1 filled example (login-page artifacts reused here)
```

Placeholders use `{{field}}` with inline constraints; guidance blocks (`#> ...`) instruct the agent and are stripped from output.

## 2. Template Catalog (initial release)

| Category | Templates | Output Validated Against |
|----------|-----------|-------------------------|
| Specification | `requirements`, `user-story`, `epic` | spec schemas; INVEST lint for stories |
| Architecture | `architecture`, `adr` | C4 sections present; root-model decision recorded |
| Flowable models | `app`, `bpmn`, `cmmn`, `dmn`, `data-object`, `form`, `page`, `dashboard`, `service`, `channel`, `event`, `agent`, `knowledge-base`, `document` | Flowable meta-model schemas (`docs/architecture/07`); engine field names enforced (`processDefinitionKey`, `taskDefinitionKey`, `formKey`, `sourceRef`/`targetRef`, `attachedToRef`, `delegateExpression`) |
| Interface | `api` | OpenAPI-style contract sections |
| Quality | `test` | strategy + golden-test stubs |
| Delivery | `release` | release manifest + trace-chain seal |

This covers the full 27-type Flowable generation surface from `docs/architecture/06`.

## 3. Registry and Selection Protocol

`.templates/registry.yaml` maps `artifact-type → template id → version → status`. The selection protocol (embedded in every command):

1. Determine artifact type from the command's `outputs`.
2. Resolve template via registry (approved versions only).
3. If no template exists → **refuse generation**, file a `template-gap` entry to `.memory/failure/`, and instruct the user to contribute one.
4. Fill template; run `tools/validate-spec` against `schema.json` before presenting output.

## 4. Validation Pipeline

```text
template fill → schema validation → field-name compliance check (Flowable models)
             → trace fields present (source story/spec IDs) → gate-ready artifact
```

CI runs the same validators on every PR touching `.specs/`, `.architecture/`, or model output dirs — humans and AI are held to the same contract.

## 5. Template Lifecycle and Contribution

Templates follow the same lifecycle as skills (draft → review → approved → deprecated → retired) with the same registry semantics. Template contributions are the second major community surface: shareable, low-barrier, immediately useful — each new template expands what the platform can generate, which is the core virality loop (Deliverable 13).
