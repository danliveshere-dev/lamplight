# Release programme

The free community beta is a separate, GitHub-first preparation profile. Version 0.1.0-beta.3 is prepared locally, not released. See [beta readiness](docs/release/beta-readiness.md) for its acceptance and outstanding decision. This does not pass Gate 6 or replace the independent dual-provider review required for stable production.

Gates 1 to 5 record earlier work and independent reviews. Their dated evidence describes the targets and limitations at the time, not a guarantee about this beta candidate:

- [Gate 1: extraction](docs/release/gate-1-evidence.md)
- [Gate 2: architecture](docs/release/gate-2-evidence.md)
- [Gate 3: adoption](docs/release/gate-3-evidence.md)
- [Gate 4: consumer QA](docs/release/gate-4-evidence.md) and [matrix](docs/release/gate-4-matrix.md)
- [Gate 5: security and licensing](docs/release/gate-5-evidence.md)
- [Gate 7: historical preparation evidence](docs/release/gate-7-preparation-evidence.md) and [readiness](docs/release/gate-7-readiness.md)

Gate 6 remains open. Stable production requires its independent dual-provider review. Gate 7 and any public release remain subject to their applicable review and explicit authorisation. Do not treat a local build as a hosted or published release.

## Existing stable release programme

The following checklists retain their historical evidence targets. They are not
a claim that the new beta candidate has passed those reviews.


This is the task authority for the standalone Lamplight repository. A gate can
move to `passed` only after its implementation evidence exists and an
independent reviewer has returned no unresolved blocker.

| Gate | Outcome | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Clean-history, allowlisted extraction | passed | `docs/release/gate-1-evidence.md` |
| 2 | Universal token and package architecture | passed | `docs/release/gate-2-evidence.md` |
| 3 | Adoption documentation and examples | passed | `docs/release/gate-3-evidence.md` |
| 4 | Cross-consumer QA and reproducibility | passed | `docs/release/gate-4-evidence.md` |
| 5 | Security, licensing and public-repo controls | passed | `docs/release/gate-5-evidence.md` |
| 5a | Modes and surfaces | in progress | spec decision D34 in the consumer repo |
| 6 | Independent Claude first-commit review | held for maintainer | Emberline handoff prepared |
| 7 | GitHub and release-candidate readiness | held until modes and surfaces land; local preparation ready; hosted work open | `docs/release/gate-7-preparation-evidence.md` |

## Gate 1 checklist

- [x] Start a new local Git history with no remote.
- [x] Record the exact upstream source commit and explicit extraction allowlist.
- [x] Copy only Lamplight source, bindings, tests and licensed font assets.
- [x] Replace consumer examples with synthetic content.
- [x] Remove consumer-owned domain tokens from executable/package surfaces.
- [x] Add a repeatable privacy and private-address scan.
- [x] Enforce a public-safe Git author and committer identity allowlist.
- [x] Keep DAS and MLA outside the core pending defined adapter contracts.
- [x] Receive independent review against the Gate 1 evidence.
- [x] Resolve every blocking finding and re-review.

## Gate 2 checklist

- [x] Make the root npm workspace private.
- [x] Define exactly two private, internal future package workspaces.
- [x] Move all 161 tokens into one canonical DTCG 2025.10 JSON document.
- [x] Generate CSS deterministically with strict alias and type validation.
- [x] Pin and verify Style Dictionary 5.5.2 without using a lossy formatter.
- [x] Keep core CSS dependency-free and fonts and living light opt-in.
- [x] Keep the React adapter structural, peer-only and free of copied assets.
- [x] Preserve the `Room` and `l-document` scoping contracts.
- [x] Add token, drift, package, export, dependency, opt-in and breakpoint tests.
- [x] Preserve the existing 17 React binding contracts.
- [x] Receive independent Gate 2 review.
- [x] Resolve every blocking finding and re-review.

## Gates 3 to 5 acceptance outline

- Gate 3: plain HTML, Astro and React adoption paths, API guidance,
  accessibility contract, browser support, migration notes and explicit
  non-goals.
- Gate 4: packed-tarball install, reproducible generation, browser and
  accessibility matrix, visual regression, reduced-motion and size budgets,
  plus the personal website as a canary consumer.
- Gate 5: licence and notices, secret and dependency review, pinned CI,
  vulnerability reporting and a formal repository security scan.

## Gate 3 checklist

- [x] Explain Lamplight's thesis and honest portability boundary in plain language.
- [x] Document packages, exports, opt-in fonts and living light.
- [x] Document tokens, DTCG aliases and CSS-bound extension values.
- [x] Classify components and recipes, including Presence, Orb and Focal Catch.
- [x] Define accessibility, reduced-motion, keyboard and no-JavaScript contracts.
- [x] State the supported-browser and evidence policy.
- [x] Document migration from the Daius2 internal package.
- [x] Define future adapter boundaries without making DAS or MLA core contracts.
- [x] Add contribution, adoption and versioning guidance.
- [x] Build synthetic plain HTML, Astro and React examples.
- [x] Add documentation-link and example smoke tests.
- [x] Receive independent Gate 3 review.
- [x] Resolve every blocking finding and re-review.

## Held decisions

- Public package namespace and GitHub owner remain Gate 7 decisions.
- DAS and MLA are future consumers or adapters. They do not define Lamplight's
  core API until their contracts are separately specified and reviewed.
- Creating a remote, pushing, publishing a package, tagging a public release or
  changing the personal website remains explicitly unauthorised.

## Gate 4 checklist

- [x] Pin Playwright and axe browser QA dependencies exactly.
- [x] Enforce deterministic builds, extracted-pack parity and size budgets.
- [x] Install packed core consumers for plain HTML and Astro.
- [x] Install packed adapter consumers against React 18.3.1 and 19.2.8.
- [x] Record current Node evidence and an honest Node 20/22.12/24 matrix.
- [x] Exercise Chromium, Firefox and Playwright WebKit at five viewports.
- [x] Check keyboard, no-JavaScript, reduced-motion, contrast and axe contracts.
- [x] Commit per-engine visual regression baselines.
- [x] Smoke the fixture in locally installed Google Chrome.
- [x] Run an immutable, hash-checked personal-website canary.
- [x] Receive independent Gate 4 review.
- [x] Resolve every blocking finding and re-review.

## Gate 5 checklist

- [x] Licence Lamplight code and documentation under Apache-2.0.
- [x] Preserve IBM Plex font assets under OFL-1.1 in NOTICE and REUSE metadata.
- [x] Define security scope, trust boundaries, invariants and honest exclusions.
- [x] Add current-file and Git-history secret checks without exposing matches.
- [x] Review the dependency lock, install scripts and runtime network boundary.
- [x] Add least-permission CI, CodeQL and dependency-review workflows.
- [x] Pin every external action to a reviewed full commit SHA.
- [x] Add npm and GitHub Actions Dependabot configuration.
- [x] Prove mutable refs, risky triggers and excess permissions are rejected.
- [x] Run a live npm advisory audit and proportional Gate 4 regression matrix.
- [x] Receive the formal Codex Security repository scan.
- [x] Receive independent Gate 5 review.
- [x] Resolve every blocking finding and re-review.

## Gate 7 preparation checklist

- [x] Prepare governance, support, conduct, issue and pull-request templates.
- [x] Prepare the GitHub initialisation and repository-settings runbook.
- [x] Prepare the first-release and npm trusted-publishing sequence.
- [x] Add an explicit current-and-history binary allowlist and metadata check.
- [x] Classify every reachable blob by content and enforce the policy in CI.
- [x] Add a release-manifest gate that stays red while names and public metadata
      remain placeholders.
- [x] Close unrestricted issue intake and separate conduct from vulnerability
      reporting.
- [x] Receive independent review of the Gate 7 preparation pack.
- [ ] Complete the Gate 6 Claude review.
- [ ] Choose and verify GitHub owner/name, visibility and npm namespace.
- [ ] Initialise the GitHub repository and witness hosted checks.
- [ ] Configure and verify branch, tag and security settings.
- [ ] Rename packages, run the final release matrix and receive maintainer-held
      acceptance.
- [ ] Obtain explicit authority for every public push, visibility change, tag,
      package publication and GitHub release.
