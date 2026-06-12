# Staging: CI Workflows

These workflow files are staged here to work around GitHub App permission constraints.

**To activate:**
```bash
cp .ci/workflows/*.yml .github/workflows/
git add .github/workflows/
git commit -m "ci: activate workflows"
git push
```

**Workflows:**
- `validate.yml` — Lint specs, validate YAML, run gate checks, test golden tests

This separation ensures the specification remains clean while allowing local development and testing of workflow automation.
