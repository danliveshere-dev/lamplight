# Components and recipes

Lamplight's component API is a class contract first. Plain HTML uses the
classes directly. The React adapter generates typed structural bindings over
the same contract and does not restyle them.

## Foundations

`Room` is the embedded boundary and `l-document` is the explicit whole-page
shell. `Etched` names a region quietly. `Wire` carries structural, live or
attention colour. These are compositional foundations rather than page
templates.

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
