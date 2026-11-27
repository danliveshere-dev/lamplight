# Folio beta candidate scope

Scoped on 27 November 2026. Proposed version `0.1.0-beta.6`. This is a plan for a local candidate, not a built or approved release.

## Source and scope

| Role | Exact source |
| --- | --- |
| Protected download baseline | `v0.1.0-beta.5` at `855ce18e8604be6ea8eba389c6a4f1579c791c27` |
| Candidate base | Public `main` at `256da910ab53ae2ed80bb35644868f48bda14d0f`, checked against the remote |
| Folio change to port | `f7a25603d77ef39d4842a6d53c41b74696014f12` |

Port Folio onto the named public base rather than releasing the whole unreleased branch. The Folio patch applies to that base without modification except for the changelog, which has context from Diagrams. Carry the Folio changelog entry alone. The rest of the patch covers the core surface styles, the build, the tests and the related documentation.

Folio on screen keeps reading-size text and chapter navigation, with its own paper and ink treatment. Small print sizes, expanded link addresses, hidden navigation and page breaks stay in print. The new print source is compiled into the existing stylesheets, so the published export map does not need a new path. No React API, token or dependency changes are proposed. The versioned core and React tarballs and browser ZIP are still built and checked together under the existing beta contract.

Update the candidate versions in the root and two workspace manifests and lockfile together. Clarify the screen and print distinction in the adoption and release copy where beta.5 language still describes Folio chiefly as print. Preserve the tagged beta.5 source, download names, checksums and manifest pin. No tag, push or publication is part of this scope.

## Leave for another release

- **Diagrams.** Keep the optional layer and its independent version out of this release and its archives. The public branch need not take Diagrams source to take Folio. A separately checked layer bundle can be considered on its own.
- **Compact button.** Keep the existing component task ready. It needs a separate component and accessibility check and is not part of the Folio fix.
- **Arc and round dials.** Keep the existing task ready. The forms are already useful in a consumer, but the reusable Dial or Gauge contract and its tests merit their own cut.
- **Editable ODT and DOCX, other adapters and stable npm.** No change. Neither a downloadable beta nor the Folio witness closes the stable release gate.

## Verification and consumer handoff

1. First witness the ported Folio on a narrow screen in native Safari and in A4 print or PDF. Confirm legibility, chapter navigation and no horizontal scroll on screen with a long URL. In print, confirm link expansion, page breaks and legibility with background graphics off. Distinguish PDF evidence from physical printing.
2. Use the existing [beta readiness contract](beta-readiness.md) on the exact candidate. Run the source and browser regressions, build and compare the archive checksums, and exercise a fresh consumer using the packed files. Keep the candidate version separate from beta.5. Record any remaining witness gap before a release decision.
3. In the pinned consumer, updating the core and React vendor tarballs and lockfile is the expected migration. Regenerate the served theme from the new core tarball and check pin parity. Leave the independently pinned Diagrams stylesheet unchanged. Recheck a Folio page and a Night or Day control when adopting the new core. No consumer pin changes are included in this scope.
4. Treat publication as a separate decision on the exact reviewed candidate and archive manifest. The existing released-download staging check will refuse the proposed version until it has a reviewed manifest digest. Keep the beta.5 digest and add the new version's digest only from verified release evidence.

At scoping, only ancestry, remote refs and patch applicability were checked. The candidate has not yet been assembled, built, witnessed or published.
