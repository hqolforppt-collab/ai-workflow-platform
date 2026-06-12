# awp-cli

The command-line interface for the **AI Workflow Platform (AWP)** — a "Repository OS" for spec-driven, AI-assisted workflow engineering.

The CLI is a thin, dependency-light wrapper around the platform contracts that already live in the repository (`.commands/`, `.skills/`, `.templates/`, `.memory/`, `.ai/constitution.md`). It does not reimplement the platform — it **discovers, validates, builds, and scaffolds** against the same artifacts CI and agents consume.

## Install

The CLI is published as `awp-cli` (the unscoped name `awp` is taken on npm). You can run it without installing via `npx`:

\`\`\`bash
npx awp-cli <command>
\`\`\`

Releases are published automatically by `.github/workflows/release-cli.yml` when a `cli-v*` tag is pushed.

Or, inside this monorepo, run it directly:

\`\`\`bash
node packages/awp-cli/bin/awp.js <command>
\`\`\`

> The binary is named `awp` once installed.

## Commands

### `awp discover`

Scans the repository and reports an inventory of skills, templates, commands, and knowledge-base domains.

\`\`\`bash
awp discover                        # human-readable summary
awp discover --output=json          # machine-readable, for CI/agents
awp discover --skills-only          # narrow to skills
awp discover --model=bpmn           # filter to a workflow model
\`\`\`

### `awp validate`

Runs the Repository OS integrity checks — the same gates CI enforces:

- every artifact registry parses and resolves,
- every command/skill/template YAML is well-formed,
- memory files are indexed (root `index.yaml` + tier-local sub-indexes),
- adapter markers are in sync across `CLAUDE.md`, `AGENTS.md`, and `.github/copilot-instructions.md`.

\`\`\`bash
awp validate            # exits non-zero on any failure
\`\`\`

### `awp build`

Assembles a workflow blueprint prompt from a user story, hydrating the relevant knowledge-base domains and templates.

\`\`\`bash
awp build "Create login and registration feature"
awp build --check       # CI mode: verify all prompt-assembly inputs exist, no output
\`\`\`

### `awp init`

Scaffolds a new AWP-compatible repository (constitution, registries, adapter stubs).

\`\`\`bash
awp init --name=my-workflow-repo
\`\`\`

## Design principles

- **Single source of truth.** The CLI reads the same contracts as agents and CI; there is no parallel config.
- **Dependency-light.** Only `yaml` is required at runtime.
- **CI-first.** Every command has a deterministic, scriptable mode (`--output=json`, `--check`) so it can be dogfooded in `.github/workflows/validate.yml`.

## License

Apache-2.0
