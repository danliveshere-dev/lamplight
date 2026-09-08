# Lamplight 1.0 release programme

This is the task authority for the standalone Lamplight repository. A gate can
move to `passed` only after its implementation evidence exists and an
independent reviewer has returned no unresolved blocker.

| Gate | Outcome | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Clean-history, allowlisted extraction | passed | `docs/release/gate-1-evidence.md` |
| 2 | Universal token and package architecture | awaiting independent review | `docs/release/gate-2-evidence.md` |
| 3 | Adoption documentation and examples | not started | pending |
| 4 | Cross-consumer QA and reproducibility | not started | pending |
| 5 | Security, licensing and public-repo controls | not started | pending |
| 6 | Independent Claude first-commit review | held for maintainer | pending Emberline handoff |
| 7 | GitHub and release-candidate readiness | not started | no public action authorised |

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
- [ ] Receive independent Gate 2 review.
- [ ] Resolve every blocking finding and re-review.

## Gates 3 to 5 acceptance outline

- Gate 3: plain HTML, Astro and React adoption paths, API guidance,
  accessibility contract, browser support, migration notes and explicit
  non-goals.
- Gate 4: packed-tarball install, reproducible generation, browser and
  accessibility matrix, visual regression, reduced-motion and size budgets,
  plus the personal website as a canary consumer.
- Gate 5: licence and notices, secret and dependency review, pinned CI,
  vulnerability reporting and a formal repository security scan.

## Held decisions

- Public package namespace and GitHub owner remain Gate 7 decisions.
- DAS and MLA are future consumers or adapters. They do not define Lamplight's
  core API until their contracts are separately specified and reviewed.
- Creating a remote, pushing, publishing a package, tagging a public release or
  changing the personal website remains explicitly unauthorised.
