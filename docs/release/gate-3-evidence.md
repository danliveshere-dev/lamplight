# Gate 3 evidence: adoption documentation and examples

Status: awaiting independent review.

Base: `54672b44799bb2e3324a376268ede2b51eb9744f`.

## Adoption surface

The README now explains Lamplight in plain language and keeps the portability
claim narrow: the core is framework-neutral CSS with optional font and browser
exports, while the React package is a structural adapter. It documents the
internal pre-release names, local-tarball workflow, export map, `Room` versus
`l-document`, origin, current status and 1.0 non-goals. No public package name,
remote or registry command is promised.

Durable guides cover:

- canonical DTCG 2025.10 tokens, alias preservation and the Lamplight-specific
  CSS-bound extension;
- primitive components, recipes and the classification of Presence, Orb and
  Focal Catch;
- accessibility, keyboard, reduced-motion and no-JavaScript behaviour;
- the supported-browser policy and its distinction between expected support
  and directly observed evidence;
- migration from the originating Daius2 internal package;
- future framework adapters and the bounded consumer roles of DAS and MLA;
- staged adoption, contribution and compatibility/versioning rules.

The originating product is named only where provenance or a migration path
requires it. The examples, package manifests, executable source and default
adoption narrative remain product-neutral.

## Runnable examples

The repository contains three private, synthetic example applications outside
the root workspace list:

| Example | Contract demonstrated | Build result |
| --- | --- | --- |
| plain HTML and vanilla JavaScript | direct framework-neutral core CSS | static HTML generated |
| Astro 7.3.1 | framework-neutral core imported by an Astro page | one static page generated |
| React 19 test host | React adapter rendered with the shared core styles | static SSR HTML generated |

All examples use invented content. The root retains exactly two future
publishable workspaces, `packages/core` and `packages/react`; examples cannot be
published accidentally because every example manifest is private and none is a
workspace member.

## Verification

- Root build generates tokens, core and React output.
- Token drift and Style Dictionary compatibility checks pass.
- Vanilla, Astro and React example builds pass.
- Root suite: 20 tests cover the existing architecture plus documentation
  links, private example boundaries, synthetic-content scanning, build output
  and core-versus-adapter adoption.
- React suite: the existing 17 component and semantic contracts pass.
- Privacy scan passes across source, generated package surfaces and Git
  identity metadata.
- Git whitespace validation passes.

The counts above must be reconfirmed on the final review target before Gate 3
can pass.

## Evidence boundary and deferred work

Gate 3 proves that the documented adoption paths build locally. It does not
claim browser-observed appearance, interaction, accessibility-tool acceptance
or visual parity. Specifically:

- no browser capture, axe run or keyboard interaction session was performed;
- the React example demonstrates deterministic server rendering, not hydration
  or client interaction;
- browser support is a policy at this gate, not an observed browser matrix;
- no packed-tarball consumer install or personal-website canary was run; and
- package names remain internal and no remote, tag, publication or namespace
  decision exists.

Those reproducibility, browser, accessibility, visual-regression, package-size
and canary checks remain Gate 4 work.

## Independent review questions

1. Can a new adopter choose plain HTML, Astro or React without internal project
   knowledge?
2. Are pre-release placeholders unmistakable, with no misleading registry or
   compatibility promise?
3. Do the docs accurately preserve token, scoping, optional-runtime and
   adapter boundaries from Gate 2?
4. Are Presence, Orb and Focal Catch classified clearly enough to avoid
   treating recipes as new core primitives?
5. Are accessibility, browser and versioning claims bounded by real evidence?
6. Do examples remain synthetic, private and outside the publishable workspace
   surface?
7. Are DAS and MLA still future consumers or adapters rather than executable
   Lamplight contracts?
