# flowable-mcp-server

An MCP stdio server that exposes the Flowable REST API as tools for Claude Code,
opencode, and any other MCP client.

## Tools (8)

| Tool | Mutates engine? | Gate-checked | REST endpoint |
|---|---|---|---|
| `health_check` | no | — | `GET /service/management/engine` |
| `validate_bpmn` | no (deploy→cascade-delete) | — | `POST/DELETE /repository/deployments` |
| `list_processes` | no | — | `GET /repository/process-definitions` |
| `query_tasks` | no | — | `GET /runtime/tasks` |
| `get_form` | no | — | `GET /form/form-definitions` or task form-data |
| `deploy` | **yes** | **G1–G4** | `POST /repository/deployments` (multipart) |
| `start_process` | **yes** | **runtime guard** | `POST /runtime/process-instances` |
| `complete_task` | **yes** | **runtime guard** | `POST /runtime/tasks/{id}` |

## Governance (Constitution R2)

The three mutating tools are **fail-closed** and share the exact gate module the
CLI uses (`@awp/governance`):

- **`deploy`** refuses unless a `blueprint_id` can be resolved (explicit param, or
  a `deploy-manifest.json` among the uploaded files) **and** all of G1–G4 are
  approved for it. Approval records are read from
  `.governance/approvals/<blueprint_id>/G{1..4}.yaml` (each `status: approved`).
- **`start_process` / `complete_task`** act on already-deployed definitions, so a
  blueprint id may not be resolvable. They are allowed only when either
  `AWP_ALLOW_RUNTIME_MUTATION=1` is set, or a `blueprint_id` is passed and is
  fully approved. Otherwise they refuse.
- The read-only tools are always allowed.

A refusal returns `{ "refused": true, "reason": "..." }` naming exactly which
gates are missing or unapproved.

## Configuration

Environment variables (names only in config — never values, per Constitution C5):

| Var | Default |
|---|---|
| `FLOWABLE_URL` | `http://localhost:8080/flowable-rest` |
| `FLOWABLE_USER` | `rest-admin` |
| `FLOWABLE_PASS` | `test` |

## Connecting

The repo ships a tracked `.mcp.json` at its root:

```json
{
  "mcpServers": {
    "flowable": {
      "command": "node",
      "args": ["packages/flowable-mcp-server/src/index.js"],
      "env": {
        "FLOWABLE_URL": "${FLOWABLE_URL}",
        "FLOWABLE_USER": "${FLOWABLE_USER}",
        "FLOWABLE_PASS": "${FLOWABLE_PASS}"
      }
    }
  }
}
```

- **Claude Code** discovers `.mcp.json` at the project root automatically; tools
  appear as `flowable.<tool>`. Approve the server when prompted.
- **opencode / other stdio clients**: point them at
  `node packages/flowable-mcp-server/src/index.js` with the env vars above.
- The server resolves the repo root by walking up from its working directory to
  the nearest `.governance/` (or `.ai/`) directory, so gate checks find the
  approval records regardless of where the client launches it.

## Layout

- `src/client.js` — REST client (auth, base URL, JSON/text + multipart), with an
  injectable `fetch` so tools can be unit-tested without a live engine.
- `src/index.js` — env resolution, governance wiring, tool registration, stdio bootstrap.
