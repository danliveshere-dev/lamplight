# Lamplight

Lamplight is a quiet design system for interfaces that should feel present
without becoming demanding. It uses dark material, warm light, etched labels
and restrained motion. In plain language, it gives a website a small set of
shared visual ingredients and interaction patterns so each screen feels like
the same place.

The useful idea is not the candlelit appearance alone. Lamplight keeps one
foreground focus, leaves room around it, reports state without urgency theatre,
and treats reduced motion and keyboard use as part of the design rather than a
later repair.

## Status

This is a clean-history, pre-release repository. Gates 1 through 5 have passed
with independent reviews. Gate 6 is held for the maintainer's separate Claude
review, and Gate 7 public hosting and release decisions remain open. The
packages are private, use deliberately internal names and have not been
published. See the [release programme](TODO.md), [Gate 5 evidence](docs/release/gate-5-evidence.md)
and [Gate 7 readiness pack](docs/release/gate-7-readiness.md).

## Honest portability boundary

The core is framework-neutral CSS plus an optional browser module. It works in
plain HTML and can be imported by bundlers used with Astro, React and other
frameworks. It does not reset a host page unless the host explicitly adds
`l-document`, and component styling stays below an `l-room` boundary.

Lamplight is currently dark-only. It expects modern CSS custom properties,
`color-mix()`, gradients and standard accessibility media queries. Its optional
living-light module uses contemporary DOM observers and pointer APIs. Browsers
without those APIs still receive the CSS surface, but not every light effect.
The React adapter declares a `react >=18` peer contract. Packed consumers have
been observed against React 18.3.1 and 19.2.8. See the [browser policy](docs/browser-support.md)
for the tested-versus-supported rule.

## Quick start before public release

There is no registry install command yet. The names below are internal and may
change at Gate 7.

From this repository, build and create local tarballs:

```sh
npm ci
npm run build
mkdir -p .packs
npm pack --workspace @lamplight-internal/core --pack-destination .packs
npm pack --workspace @lamplight-internal/react --pack-destination .packs
```

Then install the resulting `.tgz` files into a local consumer by filesystem
path. For example, replace `PATH_TO_LAMPLIGHT` with this checkout's path:

```sh
npm install PATH_TO_LAMPLIGHT/.packs/lamplight-internal-core-0.0.0-private.0.tgz
npm install PATH_TO_LAMPLIGHT/.packs/lamplight-internal-react-0.0.0-private.0.tgz
```

These are local pre-release instructions, not a public package promise. The
[plain HTML](examples/vanilla/index.html), [Astro](examples/astro/src/pages/index.astro)
and [React](examples/react/src/page.mjs) examples are runnable from this
checkout with `npm run examples:build`.

## Package and export map

| Internal package | Export | What it provides |
| --- | --- | --- |
| `@lamplight-internal/core` | `./styles.css` | Tokens and scoped components, with no font or JavaScript import |
| core | `./tokens.json` | Canonical DTCG 2025.10 tokens for tools |
| core | `./tokens.css` | Generated custom properties |
| core | `./components.css` | Component class rules |
| core | `./fonts.css` and `./fonts/*` | Opt-in IBM Plex faces and files |
| core | `./living-light` | Explicit, SSR-safe `initLivingLight()` browser enhancement |
| `@lamplight-internal/react` | `.` | Typed structural React bindings only |

The core has no dependencies. The React package has no bundled dependencies
and declares React only as a peer.

## The two boundaries

Use `l-room` when Lamplight lives inside another product. It carries the local
ground, typography, sizing and focus language without restyling the host page.

```html
<link rel="stylesheet" href="CORE_PACKAGE/styles.css">
<section class="l-room">
  <article class="l-panel" data-depth="focal">...</article>
</section>
```

Use `l-document` only when Lamplight owns the whole document. It opts the HTML
page into the body, link, form and focus shell.

```html
<html class="l-document">
  <body><main class="l-room">...</main></body>
</html>
```

`CORE_PACKAGE` is a clearly labelled placeholder for the eventual public core
package name. For local work, import the core tarball exports described above.

## Optional fonts and living light

Lamplight falls back to system faces unless the consumer separately imports
`CORE_PACKAGE/fonts.css`. The OFL-licensed IBM Plex assets ship in the core
tarball but the default stylesheet does not fetch or apply their face rules.

Living light is progressive enhancement and never starts on import:

```js
import { initLivingLight } from 'CORE_PACKAGE/living-light';

initLivingLight();
```

The call is safe during server rendering, installs at most once per document,
waits for the body when necessary and honours reduced motion declared by any
ancestor Room.

## Documentation

- [Tokens and DTCG](docs/tokens.md)
- [Components and recipes](docs/components.md)
- [Accessibility contract](docs/accessibility.md)
- [Browser support](docs/browser-support.md)
- [Migration from the internal source](docs/migration-internal-package.md)
- [Adapter contract](docs/adapters.md)
- [Adoption guide](docs/adoption.md)
- [Versioning and compatibility](docs/versioning.md)
- [Contributing](CONTRIBUTING.md)
- [Governance](GOVERNANCE.md)
- [Support](SUPPORT.md)
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Origin](docs/ORIGIN.md)

## Non-goals for 1.0

Lamplight is not a full application framework, a dashboard template, a utility
class library or a light/dark theme engine. It does not own data, routing,
content, analytics, AI behaviour or application state. It will not absorb
consumer-specific names or workflows to make one integration easier. Future
framework adapters may translate the stable class and token contracts, but
they must not fork the visual authority.

## Repository development

```sh
npm ci
npm test
npm run gate5:check
npm run gate7:prepare
```

`npm test` builds both packages and all three synthetic examples, checks the
token source and Style Dictionary compatibility, then runs architecture,
documentation and React contract suites. Nothing in those commands publishes,
creates a remote or tags a release.
