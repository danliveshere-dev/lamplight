# 0.1.0-beta.6 community beta notes (draft)

Draft for the maintainer's release decision. Not published. At publication this replaces the
beta.5 text in `beta-release-notes.md`, and the README, adoption guide, package READMEs, support
page and versioning page move their download links from beta.5 to beta.6.

**Community beta prerelease.** Lamplight is a free design system for calm interfaces, with
framework-neutral CSS and optional React bindings.

The GitHub release contains `lamplight-core-0.1.0-beta.6.tgz`, `lamplight-react-0.1.0-beta.6.tgz`,
`lamplight-browser-0.1.0-beta.6.zip`, `SHA256SUMS` and `manifest.json`. Install the tarballs from
local files or serve the extracted browser starter. See the [adoption guide](../adoption.md).

## What changed

- **Folio reads well on screen.** Folio now has its own on-screen paper and ink, at the normal
  reading size and with chapter navigation in place. Small type, printed link addresses, hidden
  navigation and chapter page breaks apply only when printing.
- **Browser starter links.** The browser download's landing page links to its own release files.

No React API, token, export path or dependency changes. Diagrams is not part of this release and
keeps its own version.

## Moving from beta.5

1. Replace the core and React tarballs with the beta.6 files and update the lockfile.
2. If you serve a generated theme from the core tarball, regenerate it and check it matches the
   new pin.
3. Leave a separately pinned Diagrams stylesheet as it is.
4. Open one Folio page and one Night or Day control to confirm they look right with your content.

Pages that used Folio only for print see no change in print. On screen they now show Folio's
paper and ink at reading size instead of print sizing.

## Limits

Folio has been checked in native Safari at desktop and phone widths and as an A4 PDF. Physical
printing, a physical phone and manual assistive technology have not been checked. This is a
prerelease and documented contracts may change in response to feedback.

## After release

Check once from the published files: the GitHub release and the site's `downloads/` match these
checksums, the browser starter's download links resolve, and a pinned consumer's theme, rebuilt from
the beta.6 core, renders a Folio page and the mode switch where its users see it.
