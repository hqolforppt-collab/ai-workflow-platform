#!/usr/bin/env bash
# trace-audit.sh — audit trace chains across project artifacts (Constitution R4).
# Usage: trace-audit.sh [project-dir]   (defaults to scanning .memory/project/)
set -euo pipefail
cd "$(dirname "$0")/.."

target="${1:-.memory/project}"
echo "==> Auditing trace blocks under: $target"

missing=0
total=0
while IFS= read -r f; do
  total=$((total+1))
  if ! grep -qE "(trace:|source:)" "$f"; then
    echo "BROKEN TRACE: $f has no trace/source block"
    missing=$((missing+1))
  fi
done < <(find "$target" -type f \( -name "*.yaml" -o -name "*.md" \) ! -name ".gitkeep" ! -name "README.md" 2>/dev/null)

echo "Audited $total artifacts; $missing broken traces."
if [ "$missing" -gt 0 ]; then
  echo "trace-audit: FAIL (broken traces fail gates — Constitution R4)"
  exit 1
fi
echo "trace-audit: PASS"
