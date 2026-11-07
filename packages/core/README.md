# Lamplight core beta

The core package contains scoped CSS, design tokens, optional IBM Plex fonts and the opt-in living-light module. Download the tarball from the [public beta release](https://github.com/danliveshere-dev/lamplight/releases/tag/v0.1.0-beta.5).

The package name is used for imports. It does not establish npm namespace ownership or registry availability. The manifest keeps `private: true` to prevent accidental npm publication; the download is public.

Install the downloaded `lamplight-core-0.1.0-beta.5.tgz` into a project with `npm install ./lamplight-core-0.1.0-beta.5.tgz`, then import `@lamplight/core/styles.css`. For a browser without a bundler, use the separate browser ZIP and its quickstart.

Fonts are optional via `@lamplight/core/fonts.css`; the JavaScript is optional via `@lamplight/core/living-light`. See the included LICENSE, NOTICE and font OFL for licence terms.

## Chapter navigation

Import `initChapterRail` from `@lamplight/core/chapter-rail` to enhance a native
`.l-chapter-rail` contents list. Pass the rail and an optional `{ header }`
element. Call the returned function when removing the view. The module is
opt-in, dependency-free and safe to import during server rendering. See
`docs/components.md` in the source repository for the complete class contract
and the chapter opener and overview patterns.
