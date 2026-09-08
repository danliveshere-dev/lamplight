# Lamplight

Lamplight is a quiet, material design system for interfaces that should feel
present without becoming demanding. Its visual language combines warm light,
dark glass, etched labels and restrained motion. The core is scoped beneath a
`.l-room` boundary so it can live beside a host website without taking over the
whole document.

This repository is a clean-history extraction of the working design system. It
is not public-release ready yet. The release programme and its open gates are
tracked in [`TODO.md`](TODO.md).

## Gate 1 development snapshot

The current tree preserves the proven CSS, optional living-light behaviour and
React binding generator while separating them from their original consumer.
Gate 2 will redesign the package boundary and token authority. Until that gate
passes, package names and generated output are internal and must not be
published.

To exercise the extracted React source:

```sh
cd packages/react
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
