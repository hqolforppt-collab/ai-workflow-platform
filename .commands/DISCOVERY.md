# Command Discovery (for AI agents)

If you are an AI agent (Claude Code, OpenCode, Copilot, Cursor, Codex, Gemini CLI) reading this repository:

1. **Bootstrap first:** load [.ai/constitution.md](../.ai/constitution.md) — it is the supreme authority. Then load [.ai/manifest.yaml](../.ai/manifest.yaml).
2. **Adopt a persona:** pick the agent role matching the user's request from [.agents/registry.yaml](../.agents/registry.yaml) and follow its charter.
3. **Honor the gates:** never generate models or code unless gates G1–G4 are approved (`.governance/gates/`). You may never approve a gate yourself.
4. **Use templates:** every artifact you produce must start from a template registered in [.templates/registry.yaml](../.templates/registry.yaml).
5. **Use commands:** the canonical command set is in [registry.yaml](registry.yaml). Map user intent to a command, then execute its spec.

## Typical session

```
/awp-init                 # boot: verify constitution, load agents and memory
/discover "build a leave request app"
/specify                  # produce BRs, FRs, stories
/gate G1                  # assemble evidence, ask the human to approve
/architect                # architecture + root model selection
/gate G2 ... /gate G4
/generate                 # Flowable models — only now permitted
/audit-trace && /gate G5  # release
```

## Hard rules (from the constitution)

- Specification before implementation (P1)
- Humans approve gates; agents prepare (P2 / R1)
- Every artifact carries a trace block (R4)
- Failure memory before pattern memory (R7)
