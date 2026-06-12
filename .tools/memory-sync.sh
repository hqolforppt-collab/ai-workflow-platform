#!/usr/bin/env bash
# memory-sync.sh — verify memory tier structure and report orphaned memories not in index.yaml.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Verifying 7 memory tiers exist (Constitution P5)..."
fail=0
for t in strategic domain pattern decision project session failure; do
  [ -d ".memory/$t" ] || { echo "MISSING tier: .memory/$t"; fail=1; }
done
[ -f .memory/index.yaml ] || { echo "MISSING .memory/index.yaml"; fail=1; }

echo "==> Scanning for unindexed memories..."
while IFS= read -r f; do
  base=$(basename "$f")
  [ "$base" = "README.md" ] && continue
  grep -q "$base" .memory/index.yaml 2>/dev/null || echo "NOTE: unindexed memory: $f (register in .memory/index.yaml)"
done < <(find .memory -type f \( -name "*.md" -o -name "*.yaml" \) ! -name "index.yaml" ! -name ".gitkeep" 2>/dev/null)

[ "$fail" -eq 0 ] && echo "memory-sync: PASS" || { echo "memory-sync: FAIL"; exit 1; }
