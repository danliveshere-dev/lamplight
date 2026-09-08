# Lamplight

Lamplight is a quiet, material design system for interfaces that should feel
present without becoming demanding. Its visual language combines warm light,
dark glass, etched labels and restrained motion. The core is scoped beneath a
`.l-room` boundary so it can live beside a host website without taking over the
whole document.

This repository is a clean-history extraction of the working design system. It
is not public-release ready yet. The release programme and its open gates are
tracked in [`TODO.md`](TODO.md).

## Gate 2 architecture snapshot

The private root workspace contains exactly two future packages:

- `packages/core` is dependency-free CSS and optional browser behaviour. Its
  default stylesheet excludes fonts and JavaScript. Fonts and living light are
  explicit opt-ins.
- `packages/react` contains structural React bindings only. It has a React peer
  contract and does not copy CSS, fonts or the living-light runtime.

The DTCG 2025.10 document in `tokens/lamplight.tokens.json` is the only token
authority. `packages/core/generated/tokens.css` is deterministic generated
output and must not be edited directly. Package names and versions remain
deliberately internal until Gate 7.

To install, build and test the complete workspace:

```sh
npm ci
npm test
```

To run the repository privacy check:

```sh
node scripts/privacy-scan.mjs
```

The vanilla example in [`examples/vanilla/index.html`](examples/vanilla/index.html)
is synthetic. It contains no personal data, private service address or
originating-consumer runtime assumption.
