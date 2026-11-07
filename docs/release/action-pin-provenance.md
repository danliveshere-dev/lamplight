# GitHub Action pin provenance

Recorded: 2026-09-08

Every external action used by Lamplight is pinned to a full commit SHA. The
following values were resolved with `git ls-remote` against the named official
repository. For an annotated tag, the peeled commit value was used. This is
tag-to-commit resolution evidence, not a claim that the commit has a
cryptographic signature.

| Action | Reviewed tag | Full commit SHA | Official repository |
| --- | --- | --- | --- |
| `actions/checkout` | `v6` | `d23441a48e516b6c34aea4fa41551a30e30af803` | `https://github.com/actions/checkout.git` |
| `actions/setup-node` | `v6` | `249970729cb0ef3589644e2896645e5dc5ba9c38` | `https://github.com/actions/setup-node.git` |
| `github/codeql-action` | `v4` | `fddeee1a7ece751b577e409a89057319e3172939` | `https://github.com/github/codeql-action.git` |
| `actions/dependency-review-action` | `v5.0.0` | `a1d282b36b6f3519aa1f3fc636f609c47dddb294` | `https://github.com/actions/dependency-review-action.git` |
| `actions/configure-pages` | `v5` | `983d7736d9b0ae728b81ab479565c72886d7745b` | `https://github.com/actions/configure-pages.git` |
| `actions/upload-pages-artifact` | `v4` | `7b1f4a764d45c48632c6b24a0339c27f5614fb0b` | `https://github.com/actions/upload-pages-artifact.git` |
| `actions/deploy-pages` | `v4` | `d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e` | `https://github.com/actions/deploy-pages.git` |
| `actions/upload-artifact` | `v4` | `ea165f8d65b6e75b540449e92b4886f43607fa02` | `https://github.com/actions/upload-artifact.git` |

Resolution commands intentionally read refs only. No action repository content
was executed. Before changing a pin, resolve the intended official tag again,
review the upstream release and commit, update this table and run
`npm run gate5:security`.

The four Pages and artifact pins were resolved on 2026-11-06. The
configure-pages pin is reviewed for future use but is not needed by the static
candidate build. Pages deployment is separately gated by the workflow policy.

CodeQL and dependency review are not enabled for the current private
staging repository. Their jobs are explicitly skipped while the repository is
private; they must run and be assessed after it becomes public. A skipped job
is not evidence that a scan passed.

CodeQL also supports a manual run so the first public candidate can be scanned before its prerelease is published.

Dependency review was re-resolved to the official v5.0.0 commit on 7 November 2026 after the earlier revision became unavailable. Its Node 24 runtime is compatible with the hosted runner, and its contents-read permission and moderate-severity gate remain unchanged.
