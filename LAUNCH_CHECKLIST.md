# v1.0 Launch Checklist — /workflow-builder

Status legend: [x] done · [ ] open

## Product completeness

- [x] Blueprint schema contract (`.schemas/workflow-blueprint/` — schema, attribute definitions, validation rules, mini-example)
- [x] Hidden-requirement discovery KB (`.memory/domain-knowledge/` — 25+ domains, trigger map, implication map)
- [x] Discovery skill (`.skills/hidden-requirement-discovery/`)
- [x] `/workflow-builder` command spec (`.commands/workflow-builder/` — command, 6-step pipeline, canonical prompt, maturity levels L1-L6)
- [x] Platform adapters for 6 tools (Claude Code, OpenCode, Cursor, Copilot, Codex, Gemini CLI)
- [x] Flagship golden example (`examples/workflow-builder/login-registration/` — full L6 blueprint + 12 golden tests)
- [x] README launch positioning (60-second install per platform, demo output, guarantees)

## Pre-launch verification

- [ ] Run `/workflow-builder Create Login and Registration Feature` in each of the 6 tools; diff against `golden-tests.yaml`
- [ ] Run a NON-auth story (e.g. "internal wiki search") and verify ANY-USER-FACING baseline still yields >= 12 cross-cutting domains
- [ ] Run a negation story (e.g. "passwordless login, no email") and verify overridden domains are marked not-applicable with reasons
- [ ] `--level=L1` and `--level=L3` produce reduced output with the documented warning
- [ ] CI green: YAML lint on all `.schemas/`, `.memory/domain-knowledge/`, `.commands/` files
- [ ] Adapter drift check passes (`npm run sync-adapters` produces no diff)

## Launch assets

- [ ] 60-90 second demo recording (terminal: one line in, coverage report out, scroll the blueprint)
- [ ] Social posts (X/LinkedIn) with the before/after framing: "you asked for login, you forgot these 25 things"
- [ ] Show HN / r/programming post drafts reviewed
- [ ] GitHub repo: topics, social preview image, pinned issue "Add a domain to the knowledge base"
- [ ] Release notes drafted in CHANGELOG.md; tag `v1.0.0`

## Day-1 community readiness

- [ ] CONTRIBUTING.md path tested end-to-end by someone who has never seen the repo
- [ ] `good first issue` labels on 5+ domain-file requests (payments, search, file-upload, multi-tenancy, i18n)
- [ ] Issue templates for: new domain, bug in discovery, blueprint validation gap
- [ ] Maintainer rota for first-48-hours issue/PR triage
