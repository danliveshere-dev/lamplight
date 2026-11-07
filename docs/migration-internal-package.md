# Migration from the Daius2 internal package

The old internal `lamplight-ui` package combined React bindings, CSS, fonts and
living light. The standalone architecture separates those responsibilities.

| Old import | Community beta equivalent |
| --- | --- |
| `lamplight-ui` | `@lamplight/react` |
| `lamplight-ui/styles.css` | `@lamplight/core/styles.css` |
| implicit bundled font faces | explicit `@lamplight/core/fonts.css` |
| `lamplight-ui/living-light` | `@lamplight/core/living-light` |

The names in the right column are the public beta's file-based package imports. They do not establish npm namespace ownership or availability. A registry release may use different names after those have been verified.

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
6. Replace source-sync scripts with the downloaded standalone beta tarballs.
   Check the migration in your application before removing its existing integration.

No personal data, automation, assistant state or service configuration moves
with this migration. Only the design-system contract travels.
