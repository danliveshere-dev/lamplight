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
| `actions/dependency-review-action` | `v4` | `cdf488f595d80d6e07e03d4674febd5ab45fa938` | `https://github.com/actions/dependency-review-action.git` |

Resolution commands intentionally read refs only. No action repository content
was executed. Before changing a pin, resolve the intended official tag again,
review the upstream release and commit, update this table and run
`npm run gate5:security`.
