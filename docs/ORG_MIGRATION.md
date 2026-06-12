# Org Migration Runbook

> **Status:** the repository currently lives at `hqolforppt-collab/ai-workflow-platform`.
> Transferring a GitHub repository to an organization is a **manual step performed
> in the GitHub UI** and cannot be done from inside the codebase. This document is
> the checklist for doing that transfer cleanly and keeping every canonical
> reference in sync afterward.

## Why this is a doc and not a script

GitHub's repo-transfer flow (Settings → General → Transfer ownership) requires:

- ownership/admin rights on **both** the source account and the destination org,
- accepting the transfer from the destination org,
- re-validating any secrets, deploy keys, and branch-protection rules.

None of that is expressible as code in this repo, so we keep a runbook instead of
pretending a script can do it.

## Canonical URL footprint

When the org/repo slug changes, exactly these files reference
`hqolforppt-collab/ai-workflow-platform` and must be updated in the same PR:

| File | Reference |
|------|-----------|
| `README.md` | clone URL + CI badge URLs (validate, bpmn-roundtrip) |
| `CHANGELOG.md` | compare/release links |
| `package.json` | `repository.url` |
| `packages/awp-cli/package.json` | `repository.url` |
| `packages/awp-cli/src/commands/init.js` | scaffold template default remote |

To find every reference before/after a move:

\`\`\`bash
grep -rln "hqolforppt-collab/ai-workflow-platform" . \
  --exclude-dir=node_modules --exclude-dir=.git
\`\`\`

After the transfer, GitHub auto-redirects the old slug, but the redirect is best
effort — update the references explicitly so badges, clone instructions, and the
CLI scaffold point at the new canonical home.

## Transfer checklist

1. **Freeze** — announce a short freeze; merge or close open PRs that touch CI or
   release config to avoid post-move conflicts.
2. **Transfer** — in GitHub: Settings → General → Danger Zone → *Transfer
   ownership* → enter the destination org and repo name.
3. **Accept** — an org owner accepts the transfer in the destination org.
4. **Secrets & vars** — re-add any Actions secrets/variables; transferred repos do
   **not** carry org-level secrets automatically.
5. **Branch protection** — re-apply protection rules on `main` (transfers may reset
   them).
6. **Update references** — open a PR replacing the old slug in the five files above.
7. **Verify CI** — confirm `validate.yml` and `bpmn-roundtrip.yml` are green under
   the new slug and that the README badges resolve.
8. **npm scope** — see below.

## npm package

The CLI is published as **`awp-cli`** (unscoped; the bare name `awp` is already
taken on npm). The npm package name is **independent of the GitHub org** — moving
the repo does *not* change it. Notes:

- `repository.url` in `packages/awp-cli/package.json` should track the GitHub slug,
  but `name` (`awp-cli`) stays stable across GitHub org moves so existing installs
  keep working.
- Publishing is automated by `.github/workflows/release-cli.yml`: pushing a
  `cli-v<version>` tag validates the platform, checks the tag matches
  `package.json`, smoke-tests the binary, and publishes with npm provenance.
- One-time setup after any org move: re-add the `NPM_TOKEN` Actions secret
  (transferred repos do not carry secrets).

## Post-migration smoke test

\`\`\`bash
node packages/awp-cli/bin/awp.js validate      # Repository OS integrity
node scripts/bpmn-roundtrip.mjs                # BPMN structural round-trip + YAML sync
node scripts/flowable-deploy-test.mjs          # live Flowable engine deployment (needs engine)
\`\`\`

All three must pass before declaring the migration complete.
