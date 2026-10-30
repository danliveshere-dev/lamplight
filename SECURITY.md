# Security policy

Lamplight is a pre-release design-system repository. It contains a
framework-neutral CSS and browser core, an optional React adapter, token build
tools, examples and repository automation. A downloadable community beta is being prepared. No package or public repository
has been released yet.

## Scope

Security review covers:

- source and generated files in `packages/core`, including the opt-in
  `living-light` browser module;
- source and generated files in `packages/react`;
- canonical tokens, generators, validation and packaging scripts;
- examples and browser fixtures when they demonstrate a Lamplight security
  property;
- dependency lock data and GitHub workflow configuration; and
- the contents and metadata of future package archives.

Documentation mistakes, licence-boundary errors and accidental private data in
public artefacts are also in scope for responsible reporting, even when they do
not create executable-code risk.

## System and trust boundaries

Lamplight publishes presentation rules and small browser helpers for use inside
a consumer-owned document. Consumer markup, text, data, custom properties and
application code are outside Lamplight's trust boundary and must be treated as
untrusted by the consumer. Lamplight does not authenticate users, authorise
actions, persist application data or provide a server.

The optional `living-light` module crosses into the browser DOM only after the
consumer explicitly imports and starts it. It must remain document-scoped,
idempotent and free of storage or network access. The React adapter crosses a
framework boundary but must remain a thin peer-only adapter rather than a copy
of core assets or runtime behaviour.

Package build dependencies and pull-request content are untrusted supply-chain
inputs. Pull-request workflows must never receive release credentials, use
`pull_request_target`, or execute an action selected by an untrusted ref. Future
package registries and GitHub are external distribution boundaries, not trusted
runtime services.

## Security invariants

- The browser core has no runtime dependencies. The React adapter has only its
  declared React peer dependency.
- First-party packages have no install lifecycle scripts, optional dependencies
  or runtime network side effects.
- `living-light` is opt-in, safe to import during server rendering and performs
  no fetch, socket, beacon, storage or dynamic code-loading operation.
- Package archives contain only paths on their exact allowlists.
- Canonical token validation fails closed on invalid aliases, types and
  unsupported projections.
- No secret, private key, credential file or private identity enters tracked or
  historical public-release content.
- Third-party GitHub Actions use reviewed full commit SHAs. Workflow permissions
  are explicit and limited to each job's purpose.
- Pull-request code is never given a secret or a release/publish capability.
- IBM Plex font files retain their OFL-1.1 terms and are not relicensed under
  Lamplight's Apache-2.0 default.

## What to report

Please report plausible issues such as:

- executable code or unexpected private files entering a package archive;
- workflow permission escalation, unsafe triggers or mutable action references;
- secret or identity disclosure in source, history, generated artefacts or
  automation logs;
- dependency or build manipulation that changes the reviewed package output;
- runtime network, storage or dynamic-code behaviour introduced by Lamplight;
- an injection, traversal or cross-site-scripting path created by Lamplight's
  own code; or
- a licence-classification failure that would distribute IBM Plex under the
  wrong terms.

A useful report states the affected version or commit, realistic preconditions,
impact and the smallest reproducible demonstration. Do not include secrets or
private third-party information in a public issue.

## Reporting route

There is no public security-reporting endpoint while this repository remains
local and pre-release. Do not infer or invent a security email address or URL.
If code has been shared privately before release, use the same private channel
to flag a concern without sending exploit details more widely.

At Gate 7, after a GitHub repository exists, the intended route is GitHub's
private vulnerability reporting feature. This document must be updated with
the actual repository-owned route only after that feature is enabled and
verified. Public issues should not contain undisclosed vulnerability details.

## Exclusions

The following are normally outside scope unless Lamplight introduces or
materially amplifies a security impact:

- unsafe consumer application code, content or custom CSS;
- unsupported changes to generated files or package contents;
- upstream browser, React, npm or GitHub defects that Lamplight does not make
  reachable;
- visual preference, design quality or accessibility findings without a
  security consequence; and
- denial of service that requires an already-controlled consumer document and
  has no effect beyond that document.

## Current limitations

Beta archives remain local until the hosted private reporting route has been
verified and recorded above. A beta label does not relax privacy, package
contents, dependency or workflow boundaries. See `docs/release/beta-readiness.md`
for the separate downloadable-beta checks and outstanding release witnesses.


The repository has local policy, package, privacy, browser and audit checks. A
formal Codex Security scan and independent Gate 5 review were completed against
the clean-history candidate, and every accepted finding was remediated and
re-reviewed. Hosted GitHub workflows cannot be exercised before a remote exists.
The current QA record also leaves unrun Node 20, Node 22.12, Safari,
assistive-technology and maintainer-held acceptance cells open. Playwright
WebKit evidence is not Safari acceptance.

No published-version support window exists yet. Until the first release, a
commit hash is the only precise identifier for a report.
