# Gate 1 evidence: clean-history extraction

Status: passed.

## Boundary

- New repository created locally with a fresh `main` branch.
- No remote, tag, release or package publication created.
- Original consumer repository read only and left untouched.
- Exact source snapshot and allowlist recorded in
  `docs/release/source-allowlist.md`.

## Extraction controls

- Only allowlisted Lamplight source, bindings, tests and IBM Plex assets were
  copied.
- Generated packages and dependency directories were rebuilt, not imported.
- React examples and test fixtures use synthetic reading-room content.
- Consumer-specific domain colour tokens were removed from the public source.
- Product names remain only in the documented origin and release evidence.
- The privacy scan checks private paths, local service addresses, likely secret
  assignments and consumer names outside explicitly reviewed provenance files.
- Repository-local Git identity is checked against the explicit
  `docs/release/public-safe-identities.txt` allowlist before a commit is made.
- Every reachable commit's author and committer email is checked against that
  allowlist, and personal email domains are rejected.

## Builder verification

Completed on 2026-09-08:

- `npm ci` in `packages/react`: passed, installing the locked five-package
  Gate 1 development environment.
- `npm test` in `packages/react`: passed, with 17 of 17 binding, semantic and
  accessibility contract tests green.
- `node scripts/privacy-scan.mjs`: passed across tracked, candidate and
  generated-package files; a negative test using an unallowlisted personal
  email domain failed as required before the public-safe identity was restored.
- `git remote -v`: empty, confirming no remote exists.
- source-reference search: the originating consumer appears only in the
  intentional origin and release-provenance documents; `hearth` remains only
  as a classified material token and prose description.
- repository inspection before commit: one fresh `main` branch, no inherited
  objects, tags or commits.

The first extraction attempt was blocked during independent review because its
commit metadata used a personal email address. That repository was preserved
locally and unchanged for audit. This release tree was recreated from the
tracked working tree with a genuinely new Git database and public-safe local
identity. No history was amended, deleted or rewritten.

The preserved blocked repository is named `lamplight-gate1-private-history`
and remains outside this release tree.

The generated `packages/react/pkg`, generated component prompt documents and
installed dependencies are ignored. This keeps the first commit limited to
human-authored or explicitly extracted source plus the font assets.

## Independent review questions

1. Does the tree contain only an explicit, defensible public allowlist?
2. Can any executable, package, example or test identify or depend on the
   original consumer?
3. Are all remaining origin and material references intentionally classified?
4. Is the repository genuinely clean-history and remote-free?
5. Do all author and committer emails match the explicit public-safe identity
   allowlist?
6. Has Gate 1 avoided silently making the Gate 2 architecture decisions?

## Independent review outcome

- Initial verdict: **BLOCKED**, with one P1 finding. Both extraction commits
  exposed a personal author and committer email, while the privacy scanner did
  not inspect Git metadata.
- Remediation: preserved the blocked repository unchanged, recreated this
  repository non-destructively from its tracked working tree, configured the
  repository-local public-safe identity, and extended the scanner to validate
  local configuration plus every reachable commit's author and committer
  emails against an explicit allowlist.
- Reviewed implementation commit:
  `efec018bf36458d9c92c581aae59d2d738301124`.
- Independent re-review verdict: **PASS**, with no findings.

Gate 1 is closed. This close-out changes documentation only; the reviewed
implementation commit above remains the evidence target.
