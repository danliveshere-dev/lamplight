# Lamplight core beta

This public beta download provides scoped CSS, design tokens, optional IBM Plex fonts and the opt-in living-light module. It is distributed as a downloaded tarball; the package name is an import identifier, not a claim that it is published to or owned on a registry.

Install the downloaded `lamplight-core-0.1.0-beta.5.tgz` into a project with `npm install ./lamplight-core-0.1.0-beta.5.tgz`, then import `@lamplight/core/styles.css`. For a browser without a bundler, use the separate browser ZIP and its quickstart.

Fonts are optional via `@lamplight/core/fonts.css`; the JavaScript is optional via `@lamplight/core/living-light`. See the included LICENSE, NOTICE and font OFL for licence terms.

## Chapter navigation

Import `initChapterRail` from `@lamplight/core/chapter-rail` to enhance a native
`.l-chapter-rail` contents list. Pass the rail and an optional `{ header }`
element. Call the returned function when removing the view. The module is
opt-in, dependency-free and safe to import during server rendering. See
`docs/components.md` in the source repository for the complete class contract
and the chapter opener and overview patterns.
