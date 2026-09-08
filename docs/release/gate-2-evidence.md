# Gate 2 evidence: universal token and package architecture

Status: awaiting independent review.

Base: `a00b7a545f0fb08a14634b8af658ae4da56d8ae7`.

## Architecture decision

The repository root is a private npm workspace with exactly two future
publishable packages. Both retain internal names, private flags and the
non-release version `0.0.0-private.0` until Gate 7 resolves public ownership and
namespace.

- `@lamplight-internal/core` has no dependencies or peer dependencies. It
  exports scoped CSS, canonical JSON and generated token CSS. Its combined
  stylesheet includes tokens and components only. Font CSS/assets and the
  browser living-light runtime are explicit subpath exports.
- `@lamplight-internal/react` has no dependencies or optional dependencies. Its
  only runtime contract is `react >=18` as a peer. Generated output contains
  structural bindings and types only, with no CSS, fonts or living-light body.

`Room` remains the pure embedded boundary. `l-document` remains an explicit
whole-document shell. Importing React cannot initialise browser behaviour.

## Token authority

`tokens/lamplight.tokens.json` is the only editable token authority and declares
the DTCG 2025.10 schema identifier. The strict Lamplight validator and formatter
generate `packages/core/generated/tokens.css`; a drift check compares the
tracked file byte for byte with fresh output.

All 161 Gate 1 tokens are accounted for:

| Tier | Count |
| --- | ---: |
| primitive | 19 |
| semantic | 118 |
| component | 24 |

There are no token retirements in Gate 2. During migration, all 161 generated
CSS property values were mechanically compared with the extracted stylesheet:
161 matched and zero differed.

The type strategy is lossless and explicit:

| Representation | Count | Projection |
| --- | ---: | --- |
| colour | 19 | structured sRGB object |
| inherited pure alias | 44 | preserved as a CSS custom-property reference |
| CSS-bound string | 30 | explicit `org.lamplight.css.syntax` extension |
| number | 5 | numeric |
| dimension | 37 | structured value and `px` or `rem` unit |
| duration | 16 | structured value and `ms` or `s` unit |
| font family | 3 | ordered family array |
| font weight | 4 | numeric weight |
| cubic Bézier | 3 | four-number array |

CSS-bound strings cover lossless browser expressions such as gradients,
shadows, borders, percentages and colour functions that a generic formatter
would otherwise flatten or mis-project. References inside those strings remain
DTCG aliases and generate back to `var(--lamp-*)` calls.

Style Dictionary `5.5.2` is pinned exactly as a root development dependency.
Its DTCG mode successfully parses the canonical source. It is an ecosystem
compatibility tool, not the authoritative formatter, because the Lamplight
formatter must preserve the alias graph and unsupported CSS projections.

## Verification

- Root build: generates tokens, core and React output.
- Root architecture suite: 15 tests covering DTCG structure, count, drift,
  aliases, types, property parity, package boundaries, exports, dependency
  policy, opt-ins, SSR safety, scoping and breakpoints.
- React suite: the existing 17 component and semantic contracts pass.
- Style Dictionary CLI: version `5.5.2`; DTCG configuration build passes.
- `npm audit`: zero vulnerabilities after the Gate 2 install.
- Core dry-run package: 17 entries, including canonical JSON, generated and
  component CSS, optional living light, and optional font assets; no bundled
  dependencies.
- React dry-run package: three entries (`package.json`, JavaScript and types),
  with no CSS, fonts, runtime copy or bundled dependency.
- Privacy scan: passes across current source, both generated package surfaces
  and all Gate 2 commits.

## Independent review questions

1. Is JSON genuinely the only editable token authority?
2. Does the formatter fail closed on bad names, types, aliases, cycles and
   unsupported projections?
3. Are all 161 legacy token properties present without silent retirement?
4. Are core CSS, optional fonts, optional living light and React structure
   separated at package and tarball boundaries?
5. Are `Room`, `l-document`, reduced-motion ancestry and SSR contracts intact?
6. Have consumer-specific tokens, DAS and MLA remained outside executable API?
