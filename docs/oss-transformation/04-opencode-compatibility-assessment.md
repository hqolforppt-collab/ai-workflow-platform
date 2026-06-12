# Deliverable 4 — OpenCode Compatibility Assessment

OpenCode discovers project behavior through `AGENTS.md`, `opencode.json` (config, agents, permissions), `.opencode/command/*.md` (custom commands), and `.opencode/agent/*.md` (custom agents).

## 1. Compatibility Matrix

| OpenCode Mechanism | Purpose | Repo Current State | Action |
|--------------------|---------|--------------------|--------|
| `AGENTS.md` | Always-loaded rules (open standard) | Absent | Generate — shared with Codex/Cursor/Gemini CLI (same file serves four platforms) |
| `opencode.json` | Project config, agent definitions, permissions | Absent | Generate with 6 agents + permission scopes |
| `.opencode/command/*.md` | Custom slash commands | Absent | One per command, frontmatter `agent:` routes to correct persona |
| `.opencode/agent/*.md` | Agent personas | Absent | Generated from `.agents/` charters |
| Permissions (`edit`, `bash`) | Per-agent tool restrictions | Absent | `dev` agent: `edit: ask` until gate artifacts exist; `analyst/po/architect`: path-scoped |

## 2. Agent Configuration Sketch

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [".ai/constitution.md", ".governance/gates/README.md"],
  "agent": {
    "analyst":   { "mode": "subagent", "prompt": "{file:.agents/analyst/persona.md}",   "tools": { "write": false } },
    "po":        { "mode": "subagent", "prompt": "{file:.agents/po/persona.md}" },
    "architect": { "mode": "subagent", "prompt": "{file:.agents/architect/persona.md}" },
    "dev":       { "mode": "primary",  "prompt": "{file:.agents/dev/persona.md}" },
    "qa":        { "mode": "subagent", "prompt": "{file:.agents/qa/persona.md}" },
    "governance":{ "mode": "subagent", "prompt": "{file:.agents/governance/persona.md}" }
  }
}
```

Key point: `prompt: {file:...}` references mean OpenCode reads the **canonical** `.agents/` charters directly — zero duplication, the adapter is pure configuration.

## 3. Command Adaptation

Each `.opencode/command/<name>.md` is 5–10 lines:

```markdown
---
description: Produce approved requirements specification
agent: po
---
Execute the canonical command at .commands/specify.md with arguments: $ARGUMENTS
```

## 4. Enforcement Strategy

OpenCode lacks Claude-style pre-tool hooks, so enforcement is layered:
1. **Persona-level**: `dev` persona's first instruction is the gate precondition check.
2. **Permission-level**: `edit: ask` for `dev` keeps a human in the loop on every implementation write.
3. **CI-level** (backstop): the gate-validation workflow (Deliverable 11) fails any PR containing implementation changes without approved spec artifacts.

## 5. Verdict

**Fully compatible via configuration + the shared `AGENTS.md` standard.** OpenCode's file-reference prompts make it the cleanest zero-duplication adapter. Effort: ~15 generated files.
