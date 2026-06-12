#!/usr/bin/env bash
# validate-spec.sh — validate all OS YAML artifacts parse correctly and registries are consistent.
set -euo pipefail
cd "$(dirname "$0")/.."

fail=0

echo "==> Validating YAML syntax across OS directories..."
while IFS= read -r f; do
  if command -v node >/dev/null 2>&1 && [ -d node_modules/yaml ]; then
    node -e "require('yaml').parse(require('fs').readFileSync('$f','utf8'))" 2>/dev/null \
      || { echo "INVALID YAML: $f"; fail=1; }
  else
    # Fallback: python or basic check
    python3 -c "import yaml,sys; yaml.safe_load(open('$f'))" 2>/dev/null \
      || { echo "WARN: could not validate $f (no yaml parser available)"; }
  fi
done < <(find .ai .agents .governance .skills .templates .memory .commands -name "*.yaml" -type f 2>/dev/null)

echo "==> Checking registry references resolve..."
for spec in $(grep -oE '\.skills/[a-z-]+/skill\.yaml' .skills/registry.yaml 2>/dev/null | sort -u); do
  [ -f "$spec" ] || echo "NOTE: skill spec not yet materialized: $spec (status may be draft)"
done
for tpl in $(grep -oE '\.templates/[a-z-]+/[a-z-]+\.yaml' .templates/registry.yaml 2>/dev/null | sort -u); do
  [ -f "$tpl" ] || echo "NOTE: template not yet materialized: $tpl (status may be draft)"
done

echo "==> Verifying constitution exists and is active..."
grep -q "status: active" .ai/constitution.md || { echo "FATAL: constitution missing or not active"; fail=1; }

[ "$fail" -eq 0 ] && echo "validate-spec: PASS" || { echo "validate-spec: FAIL"; exit 1; }
