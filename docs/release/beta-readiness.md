# Community beta readiness

Status: **local preparation, not released**. The accepted direction is a free, GitHub-first community beta distributed as files. This record is a separate beta profile, not a change to the stable-production standard.

## Candidate contract

- Candidate version: `0.1.0-beta.5`.
- Planned assets: `lamplight-core-0.1.0-beta.5.tgz`, `lamplight-react-0.1.0-beta.5.tgz`, `lamplight-browser-0.1.0-beta.5.zip`.
- Imports: `@lamplight/core` and `@lamplight/react`. Both workspaces remain private; these names make no npm ownership or availability claim. The beta is file distribution, not registry publication.
- The public site stages the same archives, checksums and manifest under `downloads/`; the browser ZIP links to the intended GitHub release rather than containing itself.
- The browser ZIP includes the Field notes landing, an examples guide with Reading, Report and Dashboard compositions and a lean print view, a component reference and a principles guide, plus the full source principles as `principles.md` and AI starter guidance as `ai-starters.md`. It includes the lead line, thread and knot patterns across Night and Day modes and Ledger and Folio surfaces.
- The builder requires a clean committed checkout and verifies that source state does not change during the build. Rebuild and compare the candidate archives and checksums to verify reproducibility.
- Run `npm run beta:check` and `npm run beta:build`, then `node scripts/beta/stage-site.mjs` to verify and stage the archives in the showcase. Inspect the resulting files and consumer paths, and record the actual results for the candidate. A command named here is a requirement, not a claim that it passed.
- Review the exact candidate, including privacy and asset contents, and obtain explicit acceptance and publication authority before any public action. Local preparation does not authorise a remote, push, visibility change, tag or release.

## Known limitations

Playwright WebKit is not Safari. Real Safari and manual assistive technology acceptance remain unobserved. Folio print is experimental; physical monochrome printing remains unobserved. Automated checks and prior evidence are useful but do not establish universal accessibility or production suitability. See the [browser matrix](gate-4-matrix.md) for earlier observed versions.

Gate 6 remains open. The separate independent dual-provider review remains required for stable production. This beta profile neither passes Gate 6 nor claims stable production acceptance. The [historical program](../../TODO.md) links prior gate evidence; those records describe their own review targets.

The candidate build omits implementation comments from distributed component CSS while retaining
them in the editable source. The existing 68 KiB raw and 12 KiB gzip combined CSS ceilings,
individual layer budgets and archive budgets remain unchanged. Source-to-distribution CSS
syntax equivalence is checked alongside package QA.

## Candidate tooling

Full source and example builds require Node 22.23.4 or newer, as required by the patched Astro development dependency. CI checks Node 22.23.4 and 24; Node 20 remains a packed-package consumer smoke test. Browser screenshot baselines are platform-specific so macOS and Linux rendering are compared with their own reviewed images.

The private candidate runs source, browser, package, licence, privacy and dependency-audit checks. CodeQL and dependency review are explicitly deferred while the repository is private under its current feature availability; a skipped job is not a passing scan. They remain enabled for the public repository. The audit threshold is high severity; remaining lower-severity development-toolchain findings are recorded in candidate evidence.

Pages builds only the showcase and its verified downloads. Publication requires a separate manual workflow dispatch with publish enabled, the public main branch and its build artefact. Pull requests cannot deploy. Before the first public release, update prepared/unreleased status to the actual release state, enable Pages with GitHub Actions as its source and witness the live site and each download.
