# Gate 7 preparation evidence

Historical record. This describes the extraction or review target at the time, including its then-pending work. See the [beta.5 publication record](beta-publication.md) for the released source and current launch evidence.

Status: local preparation pack reviewed and ready. Gate 7 remains open.

Base: Gate 5 closure `259c5afd9c26dbda62e3dbeb45b0a64402c9adf3`.

Preparation commit: `dcb0cc2ae9ef3e1f46ec129a0b759e48b944a838`.

No remote, tag, push, package publication, visibility change or GitHub release
was created.

## What is prepared

- Maintainer-led governance, bounded support language and structured bug and
  proposal intake.
- A GitHub initialisation runbook that starts privately, witnesses actual check
  names and keeps every outward action separately authorised.
- A two-stage npm path: an explicitly maintainer-held bootstrap publication,
  then repository-bound trusted publishing without a long-lived registry token.
- A content-based binary policy over every reachable Git blob and every current
  candidate file. Current-required paths, deleted historical-only paths and
  append-only approved versions have separate semantics.
- A release-manifest policy requiring exactly two distinctly named public
  workspaces, stable versions, verified repository metadata, public publish
  configuration and package-specific READMEs while the root stays private.

## Independent review

The first preparation review found three blockers: historical reachability
could satisfy a deleted current binary, candidate symlinks could be followed
outside the repository and a suggested feature-check fallback introduced extra
public and destructive activity. It also found incomplete two-package name
validation and duplicated history scanning.

The corrections now require every current binary, mark deleted extraction
sources historical-only, reject symlinks and non-regular entries with a
no-follow and file-identity check, remove the disposable-public-repository
fallback, require two distinct package names and run the history scan once in
the Node 24 source cell. The bounded re-review returned no residual blocker.

## Local verification

Observed on Node 24.17.0 with npm 12.0.1:

- `npm test`: 50 root checks and 17 React contracts passed;
- `npm run gate5:check`: licence, full-history repository security and privacy
  checks passed over 27 commits;
- `npm run gate7:prepare`: 31 allowlisted paths and 201 unique historical
  path/blob pairs passed across the uncommitted preparation state, followed by
  222 unique historical path/blob pairs across all 27 committed revisions;
- `npm run qa:size`: deterministic double builds and packs passed every source,
  gzip and tarball budget; and
- `npm run gate7:release`: failed closed as intended because the public owner,
  repository URL, package names, stable versions, metadata and package READMEs
  have not been chosen or applied.

## Remaining Gate 7 boundary

Gate 6 review, owner and namespace choices, hosted checks, repository rules,
security routes, final package metadata, Safari and assistive-technology
evidence and maintainer-held visual acceptance remain open. Publication is not
authorised by this preparation result.
