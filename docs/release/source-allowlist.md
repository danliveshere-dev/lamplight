# Gate 1 source allowlist

Historical record. This describes the extraction or review target at the time, including its then-pending work. See the [beta.5 publication record](beta-publication.md) for the released source and current launch evidence.

Source snapshot: `daius2` commit `018c5ac83c96795d1cfc8d0e39431d2c9bdf5415`.

Only the following source families were admitted to the clean repository:

| Upstream family | Standalone destination | Reason |
| --- | --- | --- |
| `theme/tokens.css` | `src/tokens.css` | Lamplight custom-property definitions |
| `theme/components.css` | `src/components.css` | Scoped component presentation |
| `theme/components.js` | `src/living-light.js` | Optional, progressive interaction layer |
| `theme/designkit/generate.mjs` | `packages/react/generate.mjs` | Binding and drift-check generator |
| `theme/designkit/manifest.mjs` | `packages/react/manifest.mjs` | Class-to-component declaration |
| `theme/designkit/examples.mjs` | `packages/react/examples.mjs` | Documentation examples, rewritten synthetically |
| `theme/designkit/src/*` | `packages/react/src/*` | Structured React bindings and types |
| `theme/designkit/test/*` | `packages/react/test/*` | Existing binding contracts, with synthetic fixtures |
| `theme/designkit/package*.json` | `packages/react/package*.json` | Reproducible Gate 1 test environment |
| `theme/designkit/fonts/*` | `assets/fonts/*` | IBM Plex files and their OFL text |

No service configuration, personal content, assistant memory, prompts,
automation, runtime database, local URL, environment file or Git history was
admitted. Generated `pkg/` output and `node_modules/` are deliberately rebuilt
and ignored rather than copied.
