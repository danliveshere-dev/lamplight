# Contributing

Lamplight welcomes small, evidence-backed changes that make the design system
more portable, legible or accessible. It is intentionally narrow. Application
features, product data and consumer workflows belong in their consumer.

## Before changing code

Open an issue or proposal for a new token, component, export, dependency or
browser requirement. State the use case, the framework-neutral meaning, the
alternative, the compatibility cost and how the result will be tested.

## Local checks

```sh
npm ci
npm test
npm run privacy
```

The root test builds both packages and the vanilla, Astro and React examples.
Changes to appearance also need the Gate 4 browser and visual evidence once
that machinery is present.

## Boundaries

- Edit `tokens/lamplight.tokens.json`, never generated token CSS.
- Keep the core dependency-free.
- Keep framework packages peer-only and free of copied core assets.
- Preserve keyboard, no-JavaScript, reduced-motion and server-rendering
  behaviour.
- Use synthetic fixtures. Do not include personal paths, service addresses,
  credentials, private content or consumer runtime data.
- Do not commit generated example `dist` directories or dependency folders.

Use Conventional Commits. Do not add attribution trailers. A contribution is
not released until the public release gates and maintainer acceptance pass.
