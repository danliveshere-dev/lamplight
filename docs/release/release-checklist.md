# Release checklist

This checklist applies after Gate 7 configuration is witnessed. It does not
authorise a release. The downloadable community beta follows the separate
[beta readiness contract](beta-readiness.md); it does not use an npm publish
workflow or claim the stable package gate is satisfied.

- [ ] Select an exact release commit and freeze compatibility changes.
- [ ] Confirm `CHANGELOG.md`, versioning and migration notes are complete.
- [ ] Run `npm ci`, `npm test`, `npm run gate5:check`,
      `npm run gate7:prepare`, package QA, browser QA and the website canary.
- [ ] Confirm the hosted required checks are green on the same commit.
- [ ] Inspect both final tarballs and verify their licences, notices, paths,
      sizes and digests.
- [ ] Stage both tarballs and record the exact publish order. npm publication
      is not atomic: if only one package publishes, stop, preserve the evidence
      and either publish the already-reviewed counterpart or issue a
      superseding version. Never overwrite or unpublish to disguise a partial
      release.
- [ ] Obtain the independent code, security, accessibility and visual reviews
      required by the changed surface.
- [ ] Confirm npm trusted-publisher and GitHub immutable-release settings.
- [ ] Draft release notes and a rollback or superseding-release plan.
- [ ] Ask the maintainer for a synchronous go before creating a tag, publishing
      either package, changing repository visibility or publishing a release.
- [ ] After publication, install both packages into clean synthetic consumers,
      verify provenance and record the immutable tag, package versions and
      digests in the Gate 7 evidence.
