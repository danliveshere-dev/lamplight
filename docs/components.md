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
