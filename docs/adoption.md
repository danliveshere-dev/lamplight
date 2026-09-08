# Adoption guide

Start with one bounded surface. Import the core styles, wrap that surface in
`.l-room`, and compose ordinary semantic HTML with Lamplight classes. Confirm
that host typography, links and controls outside the Room do not change.

## Suggested sequence

1. Use the framework-neutral core without fonts or living light.
2. Check keyboard order, focus visibility, contrast and no-JavaScript reading.
3. Add the React adapter only if typed structural bindings reduce duplication.
4. Add font faces only when the download and licence fit the consumer.
5. Add living light last, then verify reduced motion and lower-powered devices.

The synthetic examples demonstrate three integration shapes:

- [plain HTML](../examples/vanilla/index.html) links token and component CSS;
- [Astro](../examples/astro/src/pages/index.astro) imports the same core through
  a bundler; and
- [React](../examples/react/src/page.mjs) renders adapter components while the
  build separately supplies framework-neutral core CSS.

Run all three locally with `npm run examples:build`. Their generated `dist`
directories are ignored and must not be treated as release artefacts.

## Consumer extensions

Override semantic tokens on the consumer's `.l-room` or add consumer-owned
classes in a separate stylesheet. Do not patch generated token CSS or copy the
core source into an application. A useful extension remains explicit about
which layer owns it.

Adoption is successful when the consumer can upgrade Lamplight without a
manual source sync, and Lamplight can test its own package without the consumer.
