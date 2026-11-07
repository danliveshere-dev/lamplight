# Gate 4 evidence: cross-consumer QA and reproducibility

Historical record. This describes the extraction or review target at the time, including its then-pending work. See the [beta.5 publication record](beta-publication.md) for the released source and current launch evidence.

Status: passed.

Base: `6df41fe637b80f28a37956fc3c483120afd3c856`.

## Reproducible package boundary

`scripts/gate4/package-qa.mjs` creates one temporary work area and isolated npm
cache, disables package install scripts, audit and funding network calls, and
removes the work area on exit. It builds twice, packs each package twice and
compares both generated-directory digests and extracted tarball-content
digests. Tarball gzip metadata is deliberately not treated as package content.

Observed on Node 24.17.0 with npm 12.0.1:

| Surface | Raw | Gzip | Raw budget | Gzip budget |
| --- | ---: | ---: | ---: | ---: |
| tokens CSS | 7,146 B | 2,180 B | 8 KiB | 2.5 KiB |
| components CSS | 32,290 B | 6,322 B | 36 KiB | 7 KiB |
| combined token and component CSS | 39,437 B | 8,199 B | 45 KiB | 10 KiB |
| living light | 22,174 B | 5,023 B | 25 KiB | 6 KiB |
| React adapter JavaScript | 22,889 B | 5,778 B | 25 KiB | 7 KiB |

| Tarball | Packed | Unpacked | Packed budget | Unpacked budget |
| --- | ---: | ---: | ---: | ---: |
| core | 529,173 B | 615,906 B | 600 KiB | 700 KiB |
| React | 11,781 B | 41,945 B | 20 KiB | 60 KiB |

Two build digests and two extracted-pack digests matched for each package. The
pack harness enforces an exact bidirectional file allowlist for every pack: 17
core paths including `package.json`, and three React paths. Any missing, extra
or duplicate path fails. A negative regression directly supplies a deterministic
`dist/rogue-generated.js` path and proves rejection without changing generated
repository files. Package manifests also name exported files and the font
directory explicitly rather than admitting the whole distribution directory.

Both manifests have no runtime or optional dependencies and no install,
packing or preparation lifecycle hooks. Static inspection of both JavaScript
surfaces found no network-capable call. Install smoke uses the allowlisted
tarballs rather than workspace resolution and passes for vanilla, Astro 7.3.1,
React 18.3.1 and React 19.2.8.

## Browser and accessibility evidence

Pinned QA tools are `@playwright/test` 1.62.1 and `@axe-core/playwright`
4.13.0. Playwright Chromium 151.0.7922.34, Firefox 153.0 and WebKit 26.5 each
pass 11 tests, 33 of 33 total. Local Google Chrome 152.0.7977.76 passes its
separate smoke test.

The engine matrix covers the five required viewports, overflow and reflow,
visible keyboard focus, keyboard activation and tab movement, semantic content
with JavaScript disabled, system and nested-Room reduced motion, two computed
WCAG AA contrast ratios, axe WCAG A/AA rules and five committed visual baselines
per engine. Representative mobile, tablet and desktop baselines were visually
inspected after the automated run and exposed no Lamplight defect requiring a
visual-language change.

The Impeccable detector was run once on the finished fixture. It reported
`DEGRADED` because its HTML parser modules were unavailable and therefore
returned an undercount. This is not recorded as a clean detector pass. Browser
interaction, computed-contrast and axe evidence remain independently green.

## Website canary

The exact website commit
`37bef99e6d32c55aea395fdcdbe0a2331c88e4ee` was exported with `git archive` to
a temporary checkout. The canary synced from this repository's freshly built
core distribution, compared all 12 copied CSS, licence and font hashes, then
ran the website's own tests, checker and build before a local Chrome smoke.

Results: 6 of 6 tests, zero checker errors, zero checker warnings, 20 retained
hints, seven built pages and one passing Chrome smoke. The live website checkout
was not edited.

## Feasible and unavailable cells

The full evidence table is in the [Gate 4 compatibility matrix](gate-4-matrix.md).
Node 20 and 22.12 are command-ready but were not installed or executed locally;
only Node 24.17.0 is a runtime pass. Playwright WebKit is explicitly not Safari.
Safari, VoiceOver, other assistive technology and maintainer-held visual acceptance
were not run and are not inferred from automation.

## Independent review questions

1. Do the pack tests exercise installed tarballs without leaking workspace
   resolution or lifecycle execution?
2. Are reproducibility comparisons based on meaningful extracted content and
   are all published size thresholds enforced?
3. Does each browser engine cover the same interaction, accessibility,
   reduced-motion, reflow and visual contract?
4. Are the Impeccable degradation, Safari boundary and unrun Node versions
   reported without converting absence into a pass?
5. Does the canary prove exact copied assets and run wholly outside the live
   website checkout?
6. Do any tests or fixtures introduce a consumer-specific or DAS/MLA contract?

## Independent review outcome

- Reviewed target: `25bff99a651dfd2fbe9f65e6fba77fd67925433d`.
- Initial verdict: one P2 packaging finding. Package contents were observed and
  size-checked, but the pack harness did not fail on an unexpected extra path.
- Fix: `6aef4486865e5fbf2ed84e6d643ffc69d5ec30a2` adds exact bidirectional
  allowlists for all 17 core and three React tarball paths, narrows both package
  manifests and proves rogue and missing paths fail without dirtying generated
  files.
- Independent re-review verdict: **PASS**, with no findings.

Gate 4 is closed by independent review. Its pass applies to the observed cells,
not the full declared support policy. Node 20 and 22.12, Safari, VoiceOver,
other assistive technology and maintainer-held acceptance remain unrun. The
Impeccable detector remains `DEGRADED`, so its empty finding set remains an
undercount rather than a pass. These are open evidence limitations for release
readiness and must not be inferred away from the Gate 4 verdict.
