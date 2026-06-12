#!/usr/bin/env bash
# adapter-sync.sh — verify (or regenerate) platform adapters from .ai/manifest.yaml.
# Usage:
#   adapter-sync.sh --check     # CI drift detection: adapters must carry the generated header
#   adapter-sync.sh             # report adapter status
set -euo pipefail
cd "$(dirname "$0")/.."

ADAPTERS=("CLAUDE.md" "AGENTS.md" "opencode.json" ".github/copilot-instructions.md")
MODE="${1:-report}"
fail=0

echo "==> Adapter status (source of truth: .ai/manifest.yaml)"
for a in "${ADAPTERS[@]}"; do
  if [ ! -f "$a" ]; then
    echo "MISSING adapter: $a"; fail=1; continue
  fi
  if grep -qi "GENERATED" "$a" || grep -q "_generated" "$a"; then
    echo "OK: $a (carries generated marker)"
  else
    echo "DRIFT: $a missing generated marker — was it hand-edited?"
    fail=1
  fi
done

if [ "$MODE" = "--check" ] && [ "$fail" -ne 0 ]; then
  echo "adapter-sync: FAIL (adapters must be regenerated from .ai/manifest.yaml, never hand-edited)"
  exit 1
fi
echo "adapter-sync: PASS"
