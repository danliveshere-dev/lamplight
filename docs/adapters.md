# Adapter contract

An adapter translates Lamplight's stable class and semantic contracts into a
framework's component model. It does not become a second design authority.

## Required properties

A future adapter must:

- live in its own package outside the dependency-free core;
- keep its framework as a peer dependency;
- generate or author structure over documented `l-*` classes;
- import no CSS, font file or living-light body into its JavaScript bundle;
- leave living-light initialisation explicit and consumer-owned;
- preserve `Room` as a pure boundary and `l-document` as an opt-in shell;
- retain native elements, labels, ARIA relationships and keyboard behaviour;
- render useful markup without client JavaScript where the framework supports
  server rendering; and
- pass the shared package, accessibility and example contract tests.

Adapters may provide idiomatic props and state callbacks. They may not invent
consumer-specific tokens, fetch data, own copy, rename semantic states or make
an application workflow part of the core.

## Future DAS and MLA use

DAS and MLA are reserved future consumers or adapter families, not current
Lamplight APIs. Either may consume core CSS, canonical JSON or an approved
framework adapter. If either needs a new public primitive, the proposal must be
stated in framework-neutral terms, show at least one second use case and pass
the same release gates.

Until those contracts exist, their names must not appear in executable tokens,
classes, package exports or runtime branches.

## Declared and observed React compatibility

The current React adapter declares `react >=18` as its peer contract. That range
states compatibility intent, not completed matrix evidence. Gate 3 builds and
tests observed React 19.2.8 only. Gate 4 must exercise supported React 18 and 19
versions before a release candidate can claim the full declared range.
