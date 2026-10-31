# Versioning and compatibility

The prepared `0.1.0-beta.2` is a prerelease, not a published version. Its GitHub-first files use `@lamplight/core` and `@lamplight/react` as import names, without a claim to an npm namespace. Beta releases can change documented contracts before 1.0; release notes should identify breaking changes and migration steps.

After 1.0, Lamplight intends to follow semantic versioning. A patch fixes behaviour without requiring consumer edits; a minor adds backwards-compatible capability; a major removes or renames a documented contract, changes semantic state, weakens server-rendered or no-JavaScript behaviour, or raises supported platform requirements. Visual changes can break layouts and need impact review regardless of file type.

Compatibility surfaces include canonical token paths, generated CSS properties, documented `l-*` classes and data attributes, package exports, React names and types, accessibility semantics and explicit runtime initialisation. Internal scripts and generated formatting are not public API.
