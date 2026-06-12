#!/usr/bin/env bash
# setup.sh — one-command bootstrap for the AI Workflow Platform repository OS.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "AI Workflow Platform — bootstrap"
echo "================================"

echo "==> 1/4 Verifying constitution..."
grep -q "status: active" .ai/constitution.md && echo "    constitution: ACTIVE (v$(grep -m1 'version:' .ai/constitution.md | awk '{print $2}'))"

echo "==> 2/4 Validating OS structure..."
bash .tools/validate-spec.sh >/dev/null && echo "    specs: OK"
bash .tools/validate-gates.sh >/dev/null && echo "    gates: OK (G1-G5 mandatory, human-approved)"
bash .tools/adapter-sync.sh --check >/dev/null && echo "    adapters: OK (no drift)"
bash .tools/memory-sync.sh >/dev/null && echo "    memory: OK (7 tiers)"

echo "==> 3/4 Installing app dependencies (optional)..."
if command -v pnpm >/dev/null 2>&1; then pnpm install --silent || true
elif command -v npm >/dev/null 2>&1; then npm install --silent || true
fi

echo "==> 4/4 Ready."
cat <<'EOF'

Open this repository in your AI agent of choice:
  - Claude Code      -> reads CLAUDE.md
  - OpenCode         -> reads opencode.json
  - GitHub Copilot   -> reads .github/copilot-instructions.md
  - Cursor/Codex/Gemini -> reads AGENTS.md

Then start with: /awp-init
EOF
