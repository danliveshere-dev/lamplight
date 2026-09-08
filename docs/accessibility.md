# Accessibility contract

Accessibility is part of Lamplight's API. Automated checks can protect the
mechanics, but only a person using the rendered interface can accept the whole
experience.

## Keyboard and focus

- Every action must remain reachable and operable from a keyboard.
- `:focus-visible` uses one consistent, high-contrast ring.
- Menu supports Arrow Up, Arrow Down, Home, End and Escape, with focus restored
  to its trigger after dismissal.
- Tabs use unique relationships between tabs and panels and support horizontal
  arrow, Home and End movement.
- Dial-like controls expose their real finite state. A two-position ModeDial is
  a switch; several positions form a slider; invalid or single states degrade
  to non-interactive descriptions.
- A pointer-only flourish must never be the only way to understand or operate a
  control.

## Reduced motion

The core stylesheet disables ambient and transition motion under
`prefers-reduced-motion: reduce`. Living light also checks the media preference
at runtime. A Room may declare `data-motion="reduced"`; any reduced ancestor
Room governs every nested Room. A nested full-motion declaration cannot
override a reduced ancestor.

Motion communicates physical continuity, not urgency. Nothing flashes, speeds
up or pulses to demand attention.

## No-JavaScript behaviour

Core CSS and semantic HTML are the baseline. Without living light, content,
focus, form controls and navigation remain present. Pointer sheen, dwell,
wire-gleam, press trace and focus beam are optional effects. The React adapter
must render useful server markup before hydration.

## Colour, text and touch

Parchment-4 is non-text material. Text must use the documented text semantic
tokens and be checked against the surface where it actually renders. Controls
have a 44px default minimum and a 48px coarse-pointer minimum. Do not use colour
alone for a state that changes meaning; pair it with visible text or native
semantics.

## Acceptance

Before a public release, run automated accessibility checks in supported
browsers, complete keyboard journeys, inspect zoom and responsive reflow, and
manually review contrast and reduced-motion behaviour. A passing source test is
not a manual accessibility acceptance.
