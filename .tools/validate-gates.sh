#!/usr/bin/env bash
# validate-gates.sh — verify governance gate definitions are complete and constitution-compliant.
set -euo pipefail
cd "$(dirname "$0")/.."

fail=0
echo "==> Checking all 5 mandatory gates exist (Constitution R3)..."
for g in G1-requirements G2-architecture G3-data-model G4-security G5-release; do
  f=".governance/gates/$g.yaml"
  [ -f "$f" ] || { echo "MISSING mandatory gate: $f"; fail=1; continue; }
  grep -q "mandatory: true" "$f" || { echo "Gate $g must be mandatory (R3)"; fail=1; }
  grep -q "approver: human" "$f" || { echo "Gate $g approver must be human (R1)"; fail=1; }
done

echo "==> Checking assignments and transitions exist..."
[ -f .governance/gates/assignments.yaml ] || { echo "MISSING assignments.yaml"; fail=1; }
[ -f .governance/gates/transitions.yaml ] || { echo "MISSING transitions.yaml"; fail=1; }

echo "==> Checking no agent has approval authority..."
if grep -rq "mayApprove: true" .agents/ 2>/dev/null; then
  echo "VIOLATION: an agent declares approval authority (Constitution R1)"; fail=1
fi

[ "$fail" -eq 0 ] && echo "validate-gates: PASS" || { echo "validate-gates: FAIL"; exit 1; }
