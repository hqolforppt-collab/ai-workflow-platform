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

## npm package scope

The CLI is published as **`@awp/cli`** (scoped, `publishConfig.access: "public"`).
The npm scope (`@awp`) is **independent of the GitHub org** — moving the repo does
*not* change the package name. Notes:

- The `@awp` npm org/scope must be claimed separately on npmjs.com by a maintainer.
- `repository.url` in `packages/awp-cli/package.json` should track the GitHub slug,
  but `name` (`@awp/cli`) stays stable across GitHub org moves so existing installs
  keep working.
- Nothing in this repo publishes automatically; `awp` is run via `npx @awp/cli` or
  directly from the monorepo until a maintainer runs `npm publish`.

## Post-migration smoke test

\`\`\`bash
node packages/awp-cli/bin/awp.js validate      # Repository OS integrity
node .tools/bpmn-roundtrip.mjs                  # BPMN structural round-trip
node .tools/flowable-import-check.mjs           # engine import check
\`\`\`

All three must pass before declaring the migration complete.
