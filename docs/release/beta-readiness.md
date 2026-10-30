# Community beta readiness

Status: **local preparation, not released**. The accepted direction is a free, GitHub-first community beta distributed as files. This record is a separate beta profile, not a change to the stable-production standard.

## Candidate contract

- Candidate version: `0.1.0-beta.1`.
- Planned assets: `lamplight-core-0.1.0-beta.1.tgz`, `lamplight-react-0.1.0-beta.1.tgz`, `lamplight-browser-0.1.0-beta.1.zip`.
- Imports: `@lamplight/core` and `@lamplight/react`. Both workspaces remain private; these names make no npm ownership or availability claim. The beta is file distribution, not registry publication.
- Run `npm run beta:check` and `npm run beta:build`, inspect the resulting files and consumer paths, and record the actual results for the candidate. A command named here is a requirement, not a claim that it passed.
- Review the exact candidate, including privacy and asset contents, and obtain explicit acceptance and publication authority before any public action. Local preparation does not authorise a remote, push, visibility change, tag or release.

## Known limitations

Playwright WebKit is not Safari. Real Safari and manual assistive technology acceptance remain unobserved. Folio print is experimental; physical monochrome printing remains unobserved. Automated checks and prior evidence are useful but do not establish universal accessibility or production suitability. See the [browser matrix](gate-4-matrix.md) for earlier observed versions.

Gate 6 remains open. The separate independent dual-provider review remains required for stable production. This beta profile neither passes Gate 6 nor claims stable production acceptance. The [historical programme](../../TODO.md) links prior gate evidence; those records describe their own review targets.
