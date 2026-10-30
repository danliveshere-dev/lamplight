# Migration from the Daius2 internal package

This is the only migration document that intentionally names the originating
consumer. It is provenance and transition guidance, not a runtime dependency.

The old internal `lamplight-ui` package combined React bindings, CSS, fonts and
living light. The standalone architecture separates those responsibilities.

| Old import | Pre-release standalone equivalent |
| --- | --- |
| `lamplight-ui` | `@lamplight/react` |
| `lamplight-ui/styles.css` | `@lamplight/core/styles.css` |
| implicit bundled font faces | explicit `@lamplight/core/fonts.css` |
| `lamplight-ui/living-light` | `@lamplight/core/living-light` |

The names in the right column are local pre-release names and will be replaced
only after Gate 7 chooses a public namespace.

## Required consumer changes

1. Install the core package, plus React only when bindings are used.
2. Import core styles once. Import fonts separately only when IBM Plex assets
   are wanted.
3. Call `initLivingLight()` explicitly in a browser lifecycle when the optional
   effects are wanted. Importing either package no longer starts behaviour.
4. Keep embedded work beneath `Room` or `.l-room`. Add `l-document` only when
   the whole page opts into Lamplight.
5. Move consumer-specific domain colours to a consumer stylesheet. The removed
   domain tokens are not part of the standalone token API.
6. Replace source-sync scripts with a package or local tarball dependency after
   the standalone release boundary is accepted.

No personal data, automation, assistant state or service configuration moves
with this migration. Only the design-system contract travels.
