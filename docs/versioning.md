# Versioning and compatibility

Lamplight will use semantic versioning after the public namespace is chosen.
Before then, `0.0.0-private.0` and internal names carry no registry promise.

## Patch

A patch may fix CSS, documentation, types, accessibility mechanics or optional
runtime behaviour without changing documented output or requiring consumer
edits. A visual correction can still be breaking when consumers relied on the
old geometry, so the impact must be reviewed rather than inferred from file
type.

## Minor

A minor release may add tokens, classes, components, exports or backwards-
compatible props. New motion or browser requirements are not automatically
minor; they must remain optional or satisfy the existing support contract.

## Major

A major release is required to remove or rename a public token, class,
component, export or prop; change the meaning of a semantic state; weaken
server-rendered or no-JavaScript behaviour; or raise framework and browser
requirements beyond the supported policy.

## Compatibility surfaces

The public compatibility surfaces are canonical token paths, generated CSS
properties, documented `l-*` classes and data attributes, package export paths,
React component names and types, accessibility semantics, and explicit runtime
initialisation behaviour.

Generated file formatting, internal package names, private versions and
undocumented build scripts are not public API before 1.0. Release notes must
name every compatibility change and its migration path.
