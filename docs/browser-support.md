# Browser support policy

Lamplight targets the current and previous major stable releases of Chrome,
Firefox and Safari, plus the corresponding current Chromium-based Edge. Mobile
support follows current Safari on iOS and current Chrome on Android.

This is a support policy, not evidence that every browser has already passed.
Gate 4 must record the exact versions exercised for a release candidate.

## Required platform features

The CSS baseline relies on custom properties, `color-mix()`, modern gradients,
`:focus-visible`, logical media queries and standard grid and flex layout. The
optional living-light module may use Pointer Events, MutationObserver,
ResizeObserver, `requestAnimationFrame`, `matchMedia` and `Symbol.for`.

When an optional observer is unavailable, its effect may be absent. Content and
operation must remain intact. Lamplight does not ship polyfills or transpile
browser globals into the core.

## Tested, supported and best effort

- **Tested** means the release evidence names a browser version and records a
  passing automated or manual check.
- **Supported** means a defect affecting the policy range is release-relevant,
  even if that exact point version was not in the last matrix.
- **Best effort** covers older browsers and embedded web views. They should
  receive readable semantic content, but visual and living-light parity is not
  promised.

Any feature that breaks core reading or operation in the supported range must
be removed, guarded or progressively enhanced before release.
