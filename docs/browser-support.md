# Browser support policy

Lamplight targets the current and previous major stable releases of Chrome,
Firefox and Safari, plus the corresponding current Chromium-based Edge. Mobile
support follows current Safari on iOS and current Chrome on Android.

This is a support policy, not evidence that every browser has already passed.
The historical Gate 4 matrix records exact versions observed on its own target; it does not prove the current community beta.

## Required platform features

The CSS baseline relies on custom properties, `color-mix()`, modern gradients,
`:focus-visible`, native CSS nesting, logical media queries and standard grid and flex layout. The
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

The community beta is a prerelease. Real Safari and manual assistive technology have not been observed. Defects in the policy range remain relevant, but this beta does not claim all policy cells have been tested. Folio print is experimental and physical monochrome printing is unobserved.

The [beta.5 publication record](release/beta-publication.md) lists the checks completed for the released source. The earlier [Gate 4 compatibility matrix](release/gate-4-matrix.md) retains its original versions, viewports and unrun cells as historical evidence. Playwright
WebKit evidence must never be described as Safari evidence.
