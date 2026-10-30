# Lamplight

Lamplight is a quiet design system for interfaces that should feel present without becoming demanding. It offers framework-neutral CSS, optional browser enhancement and structural React bindings for focused, readable surfaces.

## Community beta status

Version **0.1.0-beta.1 is prepared locally, not released**. The intended free community beta is GitHub-first, distributed as downloadable files rather than through an npm registry. The package names `@lamplight/core` and `@lamplight/react` are import names for those files; they do not establish ownership or availability of an npm namespace. Both packages remain `private: true`.

The [beta readiness record](docs/release/beta-readiness.md) separates local preparation from the outstanding review and explicit publication decision. Earlier production gates are historical evidence, not beta acceptance. Real Safari, manual assistive technology and physical monochrome printing have not been observed; Folio print is experimental.

## Try the prepared beta

Once release assets are available, download both tarballs into your application and install by file:

```sh
npm install ./lamplight-core-0.1.0-beta.1.tgz
# For a React application with React installed:
npm install ./lamplight-react-0.1.0-beta.1.tgz
```

In a bundler-based application, import `@lamplight/core/styles.css`. Fonts are optional: import `@lamplight/core/fonts.css` separately to use the included IBM Plex faces. The browser download, `lamplight-browser-0.1.0-beta.1.zip`, contains a copyable starter with local assets; serve its extracted directory with a static web server. See [adoption](docs/adoption.md) for complete HTML and React recipes.

Night and Study are defaults. Use `data-mode="day"` to select Day; use `data-surface="ledger"` or `data-surface="folio"` to select a surface. Mode and surface are separate choices: Ledger can be Night or Day, while Folio is ink. Print applies Folio styling automatically, subject to the experimental print limitation.

The core stylesheet scopes component styling to `.l-room`; `l-document` opts a whole page into the document shell. Living light is optional and must be explicitly initialised. The React adapter declares a `react >=18` peer contract; packed consumers have been observed against React 18.3.1 and 19.2.8. These observations are not a guarantee for every version.

## Package and export map

| Download package | Export | What it provides |
| --- | --- | --- |
| `@lamplight/core` | `./styles.css` | Tokens and scoped components, with no font or JavaScript import |
| core | `./tokens.json` | Canonical DTCG 2025.10 tokens for tools |
| core | `./tokens.css` | Generated custom properties |
| core | `./components.css` | Component class rules |
| core | `./modes.css` | Mode adaptations |
| core | `./surfaces.css` | Ledger, Folio and print adaptations |
| core | `./fonts.css` and `./fonts/*` | Opt-in IBM Plex faces and files |
| core | `./living-light` | Explicit, SSR-safe `initLivingLight()` browser enhancement |
| `@lamplight/react` | `.` | Typed structural React bindings only |

The core has no dependencies. The React package has no bundled dependencies
and declares React only as a peer.

## Guides

- [Principles](docs/principles.md), [tokens](docs/tokens.md), [components](docs/components.md), [adoption](docs/adoption.md)
- [Accessibility](docs/accessibility.md), [browser support](docs/browser-support.md), [versioning](docs/versioning.md), [adapters](docs/adapters.md)
- [Plain HTML](examples/vanilla/index.html), [Astro](examples/astro/src/pages/index.astro), [React](examples/react/src/page.mjs)
- [Contributing](CONTRIBUTING.md), [governance](GOVERNANCE.md), [support](SUPPORT.md), [conduct](CODE_OF_CONDUCT.md), [origin](docs/ORIGIN.md)
- [Beta release notes](docs/release/beta-release-notes.md), [historical release programme](TODO.md)

## Local development

```sh
npm ci
npm run beta:check
npm run beta:build
node examples/showcase/build.mjs
```

The showcase build creates `examples/showcase/dist/index.html`; serve that directory locally to explore it. These commands prepare and check files locally. They do not publish a release.
