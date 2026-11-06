# Components and recipes

Lamplight's component API is a class contract first. Plain HTML uses the
classes directly. The React adapter generates typed structural bindings over
the same contract and does not restyle them.

## Foundations

`Room` is the embedded boundary and `l-document` is the explicit whole-page
shell. `Etched` names a region quietly. `Wire` carries structural, live or
attention colour. These are compositional foundations rather than page
templates.

## Lead line and Thread

A **Lead line** marks a card or region with an internal straight rule, usually
paired with an Etched label. A **Thread** connects a sequence of proofs, steps
or several thoughts. Its lead knot is semibold and adds no extra dot. These
are decorative marks: callers own the content and its semantics.

```html
<article class="l-panel">
  <div class="l-lead-line l-etched">Evidence</div>
  <div class="l-thread" data-state="live">
    <div class="l-knot" data-kind="lead">Live · current reading</div>
    <div class="l-knot">First source witnessed</div>
    <div class="l-knot">Second source witnessed</div>
  </div>
</article>
```

```jsx
<Panel>
  <LeadLine className="l-etched">Evidence</LeadLine>
  <Thread state="live">
    <Knot kind="lead">Live · current reading</Knot>
    <Knot>First source witnessed</Knot>
    <Knot>Second source witnessed</Knot>
  </Thread>
</Panel>
```

The rule and dots carry no ARIA meaning. Pair meaningful state with a visible
word or shape, as in “Live” above, and use native or ARIA semantics when the
content needs them. For a custom tone, set `--l-tone` on the marked element to a remapped Lamplight
semantic token such as `var(--lamp-accent)`, rather than a raw Night colour.
Night uses a soft halo; Day is quieter without a halo, Ledger removes the
halo, and Folio and print use plain text-coloured rules and dots even when a
custom tone is set. The Lead line's internal, partial-width rule is distinct
from Ledger's full-width `.l-lead`.

## Surfaces and actions

`Panel`, `Reading`, `Note`, `Toast` and `Skeleton` provide surfaces with
different reading purposes. `Actions`, `Button`, `Ask` and `Outcome` support a
small decision without turning the page into a queue. Use one focal panel in
a view. In a Ledger, use `.l-lead` for one lead per region.

## Forms, navigation and data

The class and React contracts include Field, Input, Select, Textarea, Toggle,
Check, Segmented, Menu, Tabs, Crumbs, Disclosure, Table, KeyValue, Status and
Chip. The React bindings provide the documented ARIA relationships and keyboard mechanics for interactive components. Plain HTML classes provide styling, not the JavaScript needed to implement an interactive menu or tabs. Use native elements where suitable or implement and test the necessary interaction. A caller owns truthful labels, useful error text and domain meaning.

## Appearance switcher

Use `.l-segmented[data-size="compact"]` for a short group of choices in a
page header. The raised selection uses the current mode's bezel tokens. In
Folio, the selection becomes an ink underline. The compact size keeps the
standard focus ring, reduced-motion behaviour and larger targets on coarse
pointers.

Put the switcher in a labelled group. Native buttons support Tab, Enter and
Space, and `aria-pressed` identifies the one current choice. The controls
start disabled and become available when the script wires them up.

```html
<div class="l-segmented" data-size="compact" id="appearance-switcher" role="group" aria-label="Appearance">
  <button type="button" data-appearance="night" aria-pressed="true" disabled>Night</button>
  <button type="button" data-appearance="day" aria-pressed="false" disabled>Day</button>
  <button type="button" data-appearance="folio" aria-pressed="false" disabled>Folio</button>
</div>
```

Use `<html class="l-document">` and place this script in `<head>` before
stylesheet links. It applies the saved choice before the first paint. Night
and Day set `data-mode` and clear `data-surface` to return to the default
Study surface. Folio sets `data-mode="day"` and `data-surface="folio"`.
Keep the surrounding Room free of an explicit mode or surface if it should
follow the page. An unknown saved choice falls back to Night, and blocked
storage still allows switching for the current page.

```html
<script>
(() => {
  const root = document.documentElement;
  const key = 'lamplight-appearance';
  const choices = ['night', 'day', 'folio'];
  let choice = 'night';

  function apply(appearance) {
    root.dataset.mode = appearance === 'night' ? 'night' : 'day';
    if (appearance === 'folio') root.dataset.surface = 'folio';
    else delete root.dataset.surface;
  }

  try {
    const saved = localStorage.getItem(key);
    if (choices.includes(saved)) choice = saved;
  } catch {
    // Storage can be unavailable. The switcher still works for this page.
  }
  apply(choice);

  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('#appearance-switcher button');
    function syncPressed() {
      for (const button of buttons) {
        button.setAttribute('aria-pressed', String(button.dataset.appearance === choice));
      }
    }

    syncPressed();
    for (const button of buttons) {
      button.disabled = false;
      button.addEventListener('click', () => {
        choice = button.dataset.appearance;
        apply(choice);
        syncPressed();
        try {
          localStorage.setItem(key, choice);
        } catch {
          // Keep the current appearance even when it cannot be saved.
        }
      });
    }
  }, { once: true });
})();
</script>
```

The same pattern runs in the [showcase component reference](../examples/showcase/components.html).

## Chapter rail, chapter opener and case overview

Use a **Chapter rail** beside a longer reading column, a **Chapter opener**
for each part's title and argument, and a **Case overview** for direct chapter
links near the introduction. The [chapter example](../examples/showcase/chapters.html)
shows all three with fictional garden observations.

```html
<div class="l-chapter-layout">
  <nav class="l-chapter-rail" aria-label="Chapter contents">
    <ol class="l-chapter-rail-chapters">
      <li class="l-chapter-rail-item">
        <a class="l-chapter-link" href="#chapter-purpose">
          <span class="l-chapter-rail-number" aria-hidden="true">I</span>
          <span class="l-chapter-name">A shared purpose</span>
        </a>
        <ol class="l-chapter-rail-items">
          <li><a href="#people">People and places</a></li>
        </ol>
      </li>
      <!-- Add the remaining chapters in document order. -->
    </ol>
  </nav>
  <article>
    <ol class="l-case-overview" aria-label="Chapter overview">
      <li><a href="#chapter-purpose"><span class="l-case-overview-number"
        aria-hidden="true">I</span>A shared purpose</a></li>
    </ol>
    <header class="l-chapter" id="chapter-purpose">
      <span class="l-chapter-number" aria-hidden="true">I</span>
      <h2 class="l-chapter-title">The shared garden</h2>
      <p class="l-chapter-argument">A useful record starts with a shared purpose.</p>
    </header>
    <section id="people"><h3>People and places</h3>...</section>
  </article>
</div>
```

The opener's two-column grid aligns the numeral and title on their first
alphabetic baseline. The argument occupies the title column, including when
the title or argument wraps. Use the heading level appropriate to the document.
Give overview numerals `l-case-overview-number` for serif type. Rail numerals
use mono type, with medium sans chapter names and small muted subsection links.

Import the optional module explicitly after the markup is available. In the
browser starter, import from `./core/chapter-rail.js` instead.

```js
import { initChapterRail } from '@lamplight/core/chapter-rail';

const dispose = initChapterRail(document.querySelector('.l-chapter-rail'), {
  header: document.querySelector('.page-header'),
});
// Call dispose() when removing this view.
```

The rail uses native anchor links in document order. The module adds
`aria-current="location"` to the active chapter and subsection, expands that
chapter's sub-items and fills earlier dots. Earlier dots describe scroll
position. A keyboard-focused subsection stays available while scrolling.
Without JavaScript, the vertical contents retains all subsection links. Missing
IntersectionObserver falls back to passive scroll tracking. Initialising again
replaces the earlier enhancement, and disposal restores the static navigation.
Missing targets and links to other documents are ignored.

Set `--l-chapter-header-offset` on the layout when providing your own fixed
header. Passing `header` measures its actual height and watches for changes.
Keep any safe-area padding inside that header so the measurement includes it.
The same offset positions the sticky rail and clears chapter and subsection
anchors. At widths up to **1100px**, the rail becomes a horizontal strip. Its
measured height also clears scroll targets. The strip scrolls within its own
width and reveals the active chapter without moving keyboard focus. The
1100px breakpoint is projected as `68.75rem` in the media query because CSS
custom properties cannot be used there.

Geometry uses `--l-chapter-dot-size` (the `--lamp-chapter-dot-size` token by
default), with the line centred at `(dot size - rule width) / 2`. Each line
segment starts at one dot's centre and ends at the next, including expanded
subsections. Dot tops derive from the name's first line height. Both the
numeral column and subsection indent use `--l-chapter-numeral-width`, with the
same column gap. This keeps subsection labels aligned with chapter names.
Fluid opener typography, line height, rule width and reading measure are
component tokens in `tokens/lamplight.tokens.json`.

Folio hides the rail and places chapter openers on new printed pages. Ledger
removes the active dot's halo. Links retain a visible focus ring. The module
uses immediate horizontal reveals and follows the host's reduced-motion
scroll behaviour.

## Instruments

Dial, ModeDial, Gauge and Runway describe world state. They must not score or
grade the person using the interface. Values and state words are caller-owned;
the components provide geometry and accessible structure.

## Presence, Orb and FocalCatch

These names came from a companion-interface use case but their public semantics
stand independently:

- `Presence` reserves quiet space for a single non-verbal presence;
- `Orb` is a decorative warm point with optional attention colour, not a status
  light; and
- `FocalCatch` joins one focal source, its state and one foreground subject.

They remain core components because their contracts are understandable without
the originating product. They are not requirements for every Lamplight page.
Consumers may omit them, and adapters must not rename them to a consumer
persona. If later use shows these semantics do not travel, a major release may
move them to an optional recipe package.

## Composition rule

Use the smallest component that carries the meaning. A recipe combines stable
components in consumer code. New application workflows, data fetches, AI
states, navigation policy and copy do not belong in this repository.

## State and keyboard meaning

Pair meaningful state with a visible word or shape and suitable native or ARIA semantics. For example, a status labelled “Ready” remains understandable without its colour. Do not use motion alone to convey a change. The React Menu and Tabs bindings provide their documented arrow-key, Home and End behaviour; Menu also supports Escape. A styled HTML element does not acquire these behaviours from CSS. Test the whole interaction with a keyboard and assistive technology in the consuming application.

Custom properties resolve where they are declared. When a Thread contains a nested mode
boundary, redeclare a custom `--l-tone` on the Knot inside that boundary so its semantic
colour resolves in the local mode. The default tone already resolves on each mark.
