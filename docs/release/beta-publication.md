# Beta.5 publication record

Lamplight **0.1.0-beta.5 was released on 7 November 2026** as a free public community beta.

- [Explore the site](https://danliveshere-dev.github.io/lamplight/).
- [Download the beta](https://github.com/danliveshere-dev/lamplight/releases/tag/v0.1.0-beta.5).
- [View the released source](https://github.com/danliveshere-dev/lamplight/tree/855ce18e8604be6ea8eba389c6a4f1579c791c27), tagged `v0.1.0-beta.5`.

The release contains the browser starter ZIP, core and React tarballs, `SHA256SUMS` and `manifest.json`. The same files are available under the site's `downloads/` directory. All three archives and both metadata files were checked against the local release files after publication. The metadata matched byte for byte, and the archives matched their SHA-256 checksums. The manifest records the exact clean source commit.

## Completed checks

These results apply to source `855ce18`, rather than every later commit on main.

| Check | Release result |
| --- | --- |
| [Main CI](https://github.com/danliveshere-dev/lamplight/actions/runs/42317900918) | All seven jobs passed: 73 source and 18 React tests on Node 22.23.4 and 24, Node 20 packed-consumer smoke, package QA and audit, and browser checks |
| Browser contracts in that CI run | 88 each in Chromium, Firefox and WebKit, 264 passed |
| [Public CodeQL](https://github.com/danliveshere-dev/lamplight/actions/runs/42317900944) | Passed, with no open code-scanning alerts after the release scan |
| [Dependency review](https://github.com/danliveshere-dev/lamplight/actions/runs/42316683752) | Passed on the released source |
| [Pages build and deployment](https://github.com/danliveshere-dev/lamplight/actions/runs/42317987321) | Passed on the released source |

All five live pages rendered in Chromium. Night, Day and Folio controls on Components and Chapters applied their expected state at desktop and mobile widths without page overflow. An independent check confirmed that the Pages and GitHub release downloads matched the local release files.

GitHub private vulnerability reporting is enabled. See [the security policy](../../SECURITY.md) for the reporting route.

## What remains open

Real Safari, manual assistive technology and physical monochrome printing have not been checked. Folio remains experimental. Automated WebKit checks do not establish Safari acceptance, and automated accessibility checks do not replace manual acceptance.

The launch audit found no high or critical dependency issues. It recorded four moderate and two low entries in development tooling. The runtime packages have no dependencies; the React adapter declares React as a peer.

The beta has not been published to npm. Package manifests retain `private: true` to prevent accidental registry publication; that flag does not restrict access to the public downloads. A stable release still needs its separate independent review and maintainer acceptance. Historical gate records retain the results and unfinished work from their own review targets.
