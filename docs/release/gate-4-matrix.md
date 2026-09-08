# Gate 4 compatibility matrix

This matrix separates declared coverage from evidence actually observed on the
Gate 4 review target. A row marked **not run** is not a pass.

## Runtime and consumer matrix

| Cell | Status | Evidence |
| --- | --- | --- |
| Node 20.x | not run locally | CI-ready: `npm ci && npm test && npm run qa:packages` |
| Node 22.12.x | not run locally | CI-ready: `npm ci && npm test && npm run qa:packages` |
| Node 24.17.0 | passed | root suite, deterministic packs, size gates and all packed consumers |
| Plain HTML / vanilla | passed | core tarball installed with scripts disabled; CSS exports resolved |
| Astro 7.3.1 | passed | core tarball installed with scripts disabled; one static page built |
| React 18.3.1 | passed | core and adapter tarballs installed; server-rendered markup verified |
| React 19.2.8 | passed | core and adapter tarballs installed; server-rendered markup verified |

The Node commands use the same locked repository and package QA harness at each
version. Node 20 and 22.12 remain unobserved until a runner executes those rows;
their presence here is a matrix definition, not release evidence.

## Browser matrix

| Cell | Status | Evidence |
| --- | --- | --- |
| Playwright Chromium 151.0.7922.34 | passed | 11 tests across interaction, accessibility and five visual baselines |
| Playwright Firefox 153.0 | passed | the same 11-test matrix |
| Playwright WebKit 26.5 | passed | the same 11-test matrix |
| Google Chrome 152.0.7977.76 on macOS | passed | local installed-browser render smoke |
| Safari | not run | Playwright WebKit is not Safari and is not reported as Safari evidence |
| VoiceOver and other assistive technology | not run | requires separate manual acceptance |

The five exact fixture viewports are `320x568`, `390x844`, `834x1112`,
`1440x900` and `2200x1200`. Every Playwright engine passed reflow, visible
keyboard focus, tab-key/arrow-key operation, JavaScript-disabled semantic
content, operating-system reduced motion, nested Room reduced motion, computed
WCAG contrast, axe WCAG A/AA rules and a committed visual baseline at each
viewport.

The generated visual baselines are browser-engine-specific. A baseline pass
detects change from this reviewed fixture; it does not by itself prove that a
change is desirable or that every possible consumer composition is accessible.

## Personal website canary

The canary uses `git archive` of website commit
`37bef99e6d32c55aea395fdcdbe0a2331c88e4ee` in a temporary directory. It never
edits the live checkout. From Lamplight `packages/core/dist`, it copies and
hash-compares 12 files: tokens, components, the font stylesheet, the font
licence and eight font binaries.

Observed results on Node 24.17.0:

- website tests: 6 of 6 passed;
- `astro check`: 0 errors, 0 warnings and 20 non-blocking hints;
- production build: 7 pages passed; and
- local Google Chrome build smoke: passed with no page or console error.

The 20 hints are retained as diagnostics. This is not a clean-zero-diagnostic
claim, and website usability remains owned by its own release process.
