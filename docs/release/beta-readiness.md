# Community beta readiness

Status: **0.1.0-beta.5 is public**, released on 7 November 2026. The [publication record](beta-publication.md) links the exact source, downloads, deployment and passing hosted checks. The beta is distributed as files through GitHub. It has its own acceptance checks; the stable-production standard remains unchanged.

## Beta contract

- Version: `0.1.0-beta.5`.
- Release assets: `lamplight-core-0.1.0-beta.5.tgz`, `lamplight-react-0.1.0-beta.5.tgz`, `lamplight-browser-0.1.0-beta.5.zip`.
- Imports: `@lamplight/core` and `@lamplight/react`. Both workspaces remain private; these names make no npm ownership or availability claim. The beta is file distribution, not registry publication.
- The public site serves the same archives, checksums and manifest under `downloads/`. The browser ZIP links to the GitHub release so it does not contain another copy of itself.
- The browser ZIP includes the Field notes landing, an examples guide with Reading, Report and Dashboard compositions and a lean print view, a component reference and a principles guide, plus the full source principles as `principles.md` and AI starter guidance as `ai-starters.md`. It includes the lead line, thread and knot patterns across Night and Day modes and Ledger and Folio surfaces.
- The builder requires a clean committed checkout and verifies that source state does not change during the build. Rebuild and compare the candidate archives and checksums to verify reproducibility.
- Run `npm run beta:check` and `npm run beta:build`, then `node scripts/beta/stage-site.mjs` to verify and stage the archives in the showcase. Inspect the resulting files and consumer paths. Record what actually ran and what passed.
- The maintainer accepted and authorised beta.5 before publication. Future releases need their own acceptance and publication authority.

## Known limitations

Real Safari, manual assistive technology and physical monochrome printing have not been checked. Folio remains experimental. Playwright WebKit checks do not establish Safari acceptance. Automated checks help, but the complete interface still needs manual acceptance. See the [browser matrix](gate-4-matrix.md) for earlier observed versions.

Gate 6 remains open. The separate independent dual-provider review remains required for stable production. This beta profile neither passes Gate 6 nor claims stable production acceptance. The [historical program](../../TODO.md) links prior gate evidence; those records describe their own review targets.

The package build omits implementation comments from distributed component CSS while retaining
them in the editable source. The existing 68 KiB raw and 12 KiB gzip combined CSS ceilings,
individual layer budgets and archive budgets remain unchanged. Source-to-distribution CSS
syntax equivalence is checked alongside package QA.

## Build and release checks

Full source and example builds require Node 22.23.4 or newer, as required by the patched Astro development dependency. CI checks Node 22.23.4 and 24; Node 20 remains a packed-package consumer smoke test. Browser screenshot baselines are platform-specific so macOS and Linux rendering are compared with their own reviewed images.

The released source passed source, browser, package, licence, privacy and dependency-audit checks. Public CodeQL and dependency review also passed. Earlier private-staging runs of those two scans were skipped; they are retained as historical evidence, not passes. The audit threshold is high severity. The launch audit recorded zero high or critical findings, four moderate and two low findings in development tooling.

The [public site](https://danliveshere-dev.github.io/lamplight/) presents the showcase and downloads, and the [GitHub prerelease](https://github.com/danliveshere-dev/lamplight/releases/tag/v0.1.0-beta.5) provides the release files. Pages builds only the showcase and its verified downloads. To update the live site, a maintainer must run the Pages workflow manually with `publish` enabled on public `main`. It deploys that run's build artefact. Pull requests cannot deploy.

Site-only updates keep the existing release downloads. The publishing workflow stages them with `--released`, which verifies the checksums and the source commit recorded by the annotated release tag. The site can change while the versioned beta archives stay fixed.

The released manifest digest is pinned in the staging script from the publication evidence. A consistently replaced set of release files is rejected even if its checksums agree with one another. A new version needs a separately reviewed manifest pin.
