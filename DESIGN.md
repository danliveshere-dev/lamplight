---
name: Lamplight
description: A calm interface system for reading, working and sharing.
colors:
  soot-0: "#0f0d12"
  soot-1: "#141118"
  soot-2: "#1a1620"
  soot-3: "#231c2b"
  parchment: "#e8dcc4"
  tallow: "#dfc99b"
  dusk: "#a3a5d6"
  phosphor: "#8fdccd"
  moss: "#a8c398"
  ember: "#eaa876"
  hearth: "#e39a9a"
  ink: "#241d12"
  paper: "#f6ecd9"
  paper-bright: "#fbf7ee"
  paper-white: "#fffdf8"
  paper-deep: "#efe3cb"
  ink-tallow: "#766238"
  ink-dusk: "#5f5e9e"
  ink-phosphor: "#446c65"
  ink-moss: "#5a6952"
  ink-ember: "#9a5204"
  ink-hearth: "#a3474b"
typography:
  body:
    fontFamily: "IBM Plex Sans, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
  reading:
    fontFamily: "IBM Plex Serif, Iowan Old Style, Palatino, Georgia, serif"
    fontSize: "1.1875rem"
    lineHeight: 1.75
  label:
    fontFamily: "BlexMono Nerd Font Mono, IBM Plex Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "0.75rem"
rounded:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  full: "9999px"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  5: "1.25rem"
  6: "1.5rem"
  8: "2rem"
  10: "2.5rem"
  12: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.tallow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
---

# Design System: Lamplight

## Overview

Lamplight is quiet and warm, designed for useful, readable things. Night and Day describe the light; Study, Ledger and Folio describe the work. These choices are independent. Study makes space for reading, Ledger supports scanning and comparison, and Folio prepares content for print.

**Key characteristics:**
- Honest materials and a clear point of emphasis.
- Readable hierarchy, labelled state and purposeful motion.
- Plain language and room to focus.

## Colors

Night layers soot grounds with parchment text and tallow emphasis. Day uses paper grounds and darker ink equivalents. Dusk, phosphor, moss, ember and hearth carry links or distinct states; their ink counterparts work on light ground. Use semantic roles so mode changes remain coherent. Red is for genuine errors, and state is never conveyed by colour alone.

## Typography

IBM Plex Sans carries interface text; IBM Plex Serif gives reading and headings a measured voice; the mono stack serves labels, tables and instruments. The showcase uses a large, regular serif heading and a comfortable reading measure. Tables use tabular figures. Existing etched labels are part of the vocabulary.

## Layout

Use generous spacing for reading and aligned, grouped rows for comparison. The showcase centres content within 76rem, uses responsive side padding and collapses its two-column examples at 700px. On narrow screens preserve readable headings and access to wide tables. Folio uses a clear page grid and adapts wide content to fit.

## Elevation & Depth

Night can use subtle sheen, inner edges and light to suggest depth; Day relies on paper tone and rules. Ledger favours alignment and rules. Folio uses type and rule weight on plain paper. Motion needs a reason, respects reduced-motion preferences and is absent from Folio.

## Shapes

Panels and controls use the established rounded scale and fine boundaries. Use internal Lead lines or Threads for composition rather than coloured top or left border bars on rounded panels. Functional one-pixel boundaries remain useful.

## Components

Buttons include primary, quiet, ghost, danger and bezel treatments, with visible focus and disabled states. Fields have labels, a sunken ground and text errors. Chips and status marks pair colour with words. Real tables use headings and labelled state; navigation can use ordinary links and native disclosure.

Lead lines, Threads and Knots are decorative marks around meaningful text, not controls or state labels. A Lead line is a straight 2px rule at 75% width. Threads connect a sequence; Knots mark its entries. Night permits their soft glow, Ledger removes halos, and Folio renders them in black. Preserve meaningful reading order.

## Do's and Don'ts

### Do:
- **Do** keep one clear lead per region in Ledger and per page in Folio.
- **Do** provide keyboard access, visible focus and readable contrast.
- **Do** replace interactive controls with current values in print and date state where needed.

### Don't:
- **Don't** rely on colour or motion alone to communicate state.
- **Don't** use coloured top or left border bars on rounded panels as decorative emphasis.
- **Don't** allow print content to clip or retain unnecessary motion.
