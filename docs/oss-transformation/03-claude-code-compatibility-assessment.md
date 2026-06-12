# Deliverable 3 — Claude Code Compatibility Assessment

Claude Code discovers project behavior through `CLAUDE.md`, `.claude/commands/`, `.claude/agents/` (subagents), `.claude/skills/`, and `settings.json` hooks.

## 1. Compatibility Matrix

| Claude Code Mechanism | Purpose | Repo Current State | Action |
|----------------------|---------|--------------------|--------|
| `CLAUDE.md` | Always-loaded project instructions | Absent | Generate: constitution summary, gate rules, command index, pointer to `.ai/` |
| `.claude/commands/*.md` | Slash commands | Absent | One file per command (`/discover` … `/release`), each a thin wrapper invoking `.commands/<name>.md` |
| `.claude/agents/*.md` | Subagents with own context | Absent | 6 subagents generated from `.agents/` charters |
| `.claude/skills/*/SKILL.md` | Model-invoked skills | Absent | Generated from `.skills/` registry entries |
| `.claude/settings.json` hooks | Deterministic enforcement | Absent | PreToolUse hook: block Write/Edit to `src/**` or model output dirs unless approval artifacts exist |
| `.mcp.json` | MCP servers | Absent | Optional: Flowable REST MCP for deploy-to-engine workflows |

## 2. Spec-Driven Enforcement (Claude Code-specific)

Claude Code is the only platform with **deterministic hooks**, so it gets the strongest guarantee:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{ "type": "command", "command": ".tools/hooks/enforce-gates.sh" }]
    }]
  }
}
```

`enforce-gates.sh` rejects writes to implementation paths when `.specs/**/status != approved` — the AI *cannot* bypass approvals even if prompted to.

## 3. Subagent Design

| Subagent | Source Charter | Tool Access |
|----------|---------------|-------------|
| `analyst` | Business Analyst | Read, Grep, WebSearch |
| `po` | Product Owner | Read, Write (`.specs/` only) |
| `architect` | Architect | Read, Write (`.architecture/` only) |
| `dev` | Developer | Full, gated by hook |
| `qa` | QA | Read, Bash (test commands) |
| `governance` | Governance | Read, Write (`.governance/decisions/` only) |

Path-scoped write access per subagent mirrors the separation-of-duties model in `ai-delivery-os/07-governance-architecture.md`.

## 4. CLAUDE.md Content Contract

1. Mission + one-paragraph repo map.
2. **Non-negotiables**: spec-first ordering, five gates, template-first generation.
3. Command index table (name → purpose → stage).
4. Memory protocol: read `.memory/index.yaml` at session start; write session learnings to `.memory/session/`.
5. "When in doubt, run `/discover`" default behavior.

## 5. Verdict

**Highest-fidelity platform.** Hooks make Claude Code the reference implementation for gate enforcement. Effort: ~25 generated files, 1 shell hook.
