# Gate 7: historical hosting plan and stable release work

The public beta.5 repository, tag, GitHub release and Pages site launched on 7 November 2026. See the [publication record](beta-publication.md) for the completed work. No npm registry release has been made; the stable registry gate remains open.

The hosting plan and acceptance list below are retained as historical preparation evidence. They describe the choices and outstanding work at that review point, not the current status of the public beta. The npm sequence is a plan for a separate future registry release, subject to its own review and authorisation.

Gate 7 turns a reviewed local candidate into a hosted project. The safest low-
touch route is to initialise an empty private GitHub repository, witness the
hosted controls, then change visibility only after Gate 6 and the hosted checks
are clean. Starting private delays community visibility and npm provenance, but
it gives the first workflow run and repository settings a reversible staging
point.

## Downloadable beta route

The community beta has a separate local preparation contract in
[beta-readiness.md](beta-readiness.md). It prepares downloadable archives with
`0.1.0-beta.5` versions, keeps registry publication disabled, and does not claim
that the stable npm manifest gate or independent production review has passed.
The route below remains the stable registry release program. Public repository
configuration, private reporting routes and the maintainer's final publication
choice still have to be witnessed before the prepared beta is shared.

## Three choices the maintainer still owns

| Choice | Recommendation | Alternative and trade-off |
| --- | --- | --- |
| GitHub owner and name | Personal profile plus repository name `lamplight`, because the project is intended to support the maintainer's own public profile | An organisation makes future co-maintenance and package scope cleaner, but creates more setup and administration now |
| Initial visibility | Private for the first hosted run, then public after Gate 6 and the hosted witness | Public immediately is simpler, but makes any configuration or history mistake externally visible at once |
| npm namespace | A user-owned scope with `lamplight` and `lamplight-react` package names | A dedicated organisation scope is more brand-neutral, but requires organisation ownership and upkeep |

Do not rename the internal packages until the npm scope and both final names
have been checked on the registry. The rename is one reviewed commit across
manifests, lock data, examples, documentation, tests and package allowlists.

## GitHub initialisation sequence

1. Before creating anything, verify that the chosen GitHub account and private
   repository plan expose the required ruleset and security features. If they
   do not, use the fallback below rather than silently weakening the gate.
2. Create an empty repository with no generated README, licence or ignore file.
   Keep it private for the first hosted run.
3. Record the exact owner, repository URL and default branch in this document
   and `SECURITY.md`. Add a remote only after confirming the empty target.
4. Push the single clean local `main` history without rewriting it. Clone it
   into a new temporary directory and run `npm run gate5:check` and
   `npm run gate7:prepare` there. Confirm commit count and tip match the local
   candidate.
5. Let push-triggered CI and the checked-in CodeQL workflow run. Dependency
   review is pull-request-only, so create one bounded documentation-only PR
   after the initial private push and witness its result there. Do not enable
   CodeQL default setup while the checked-in advanced workflow is active.
6. Observe the actual hosted check names, then create an active `main` ruleset:
   require a pull request, require conversation resolution and the observed
   release checks, require linear history, and block branch deletion and force
   pushes. For a solo project, start with zero mandatory human approvals. A
   compulsory second reviewer would turn every hobby change into external toil.
7. Allow squash merge only and automatically delete merged branches. Keep
   Actions permissions read-only by default and do not allow Actions to create
   or approve pull requests.
8. Enable the dependency graph, Dependabot alerts and security updates. Confirm
   secret scanning and push protection for the chosen visibility and account
   plan. Enable private vulnerability reporting once the repository is public,
   verify the route, then replace the placeholder wording in `SECURITY.md` and
   `SUPPORT.md`. Verify a separate private conduct route before publishing
   `CODE_OF_CONDUCT.md`.
9. Enable immutable releases before the first GitHub release. Protect `v*` tags
   from update and deletion through a tag ruleset as an additional control.
10. Add the final description, website link and a small topic set only after the
   repository is public. Discussions are optional; enable them only if there is
   genuine demand rather than creating another empty surface to maintain.

If the private staging repository cannot expose a required security or ruleset
feature, keep it private and document the missing witness. After a separately
authorised visibility change, configure and witness the public-only controls on
the actual reviewed Lamplight repository before any package, tag or release
action. If a required control is unavailable there, Gate 7 remains open.

Candidate required checks, to confirm by observed hosted names, are the Node
22.23.4 and 24 source cells, with Gate 5 running in both and Gate 7 history policy
running once in Node 24; Node 20 packed-consumer smoke; packed packages and
audit; Chromium, Firefox, WebKit, CodeQL and dependency review. Never configure
required checks from this list without first witnessing their actual GitHub
check names.

## npm distribution sequence

1. Verify ownership and availability of the chosen scope and package names.
2. Replace the internal names and private versions in one reviewed release-
   candidate commit. The root remains private; both publishable workspaces must
   remove `private`, use final scoped names and stable versions, and declare the
   verified repository, homepage, issue tracker and public `publishConfig`.
   Each package also needs its own public README. Run `npm run gate7:release`
   and every Gate 4 and Gate 5 check again.
3. Inspect `npm pack --dry-run --json` for both workspaces and compare the
   archive paths, sizes, licences and notices with the exact package policy.
4. Create the first public package versions through one bounded maintainer-held
   bootstrap publish with two-factor authentication. npm cannot configure a
   package trust relationship until the package already exists.
5. Immediately configure npm trusted publishing for the exact public GitHub
   repository and release workflow, then restrict traditional token-based
   publishing. Use no long-lived npm token in GitHub secrets.
6. Add a separate, reviewed release workflow only after the trust relationship
   exists. It should publish from an immutable version tag after required checks,
   with the minimum `contents: read` and `id-token: write` permissions and no
   execution on pull requests.
7. Publish a draft GitHub release first, attach final artefacts, verify package
   and tag digests, then publish it. Immutable releases prevent changing assets
   or moving the tag afterwards.

## Binary repository policy

`docs/release/binary-allowlist.json` records the exact current version of every
required font and synthetic visual baseline by path, SHA-256 digest and byte
size. Deleted extraction-source paths are separately marked historical-only.
When a legitimate older version of one path remains reachable, it is retained
in the entry's append-only `approvedHistory`. `npm run gate7:prepare` classifies every
reachable blob by extension, magic bytes, UTF-8 validity, NULs and control
characters, then checks approved current and historical content, WOFF2
signatures, PNG structure, trailing data and textual metadata. The small WebKit
EXIF block is accepted only when it contains the declared colour-space and
exact pixel dimensions.

Any new or changed binary requires an independent visual or provenance review
before its digest enters the allowlist. The machine check proves identity and
metadata shape. It cannot prove that pixels are private-data-free, visually
correct or accessible.

## Gate 7 acceptance

- [ ] Gate 6 Claude review is complete with no unresolved blocker.
- [ ] Owner, repository name, visibility and npm namespace are recorded.
- [ ] Fresh-clone history, identity, privacy and binary controls pass.
- [ ] Hosted CI, CodeQL and dependency review pass at the exact candidate.
- [ ] The active branch and tag rulesets match the witnessed checks.
- [ ] Secret scanning, push protection and the private reporting route are
      verified for the final public repository.
- [ ] A separate privacy-preserving conduct-reporting route is verified, or the
      code of conduct is withheld until one exists.
- [ ] Public package names and versions replace every internal placeholder.
- [ ] Both final package tarballs pass exact-content and consumer QA.
- [ ] Safari, assistive-technology and maintainer-held visual acceptance are
      either witnessed or explicitly retained as release limitations.
- [ ] The maintainer explicitly authorises each visibility change, first push,
      package publish, tag and release publication.

## Primary references

- [GitHub repository rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub repository security quickstart](https://docs.github.com/en/code-security/getting-started/quickstart-for-securing-your-repository)
- [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting)
- [GitHub immutable releases](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/prevent-release-changes)
- [npm scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)
- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
- [npm package trust configuration](https://docs.npmjs.com/cli/v11/commands/npm-trust/)
