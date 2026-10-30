# Tokens and DTCG

## Authority

`tokens/lamplight.tokens.json` is the only editable token source. It uses the
DTCG 2025.10 format and organises 175 tokens into three groups:

- `primitive`: raw material values such as soot, parchment, candle and ember;
- `semantic`: roles such as text, surface, focus, spacing and motion; and
- `component`: the narrow values consumed by a component or host integration.

Run `npm run tokens:build` after a token change. The command validates the JSON
and deterministically writes `packages/core/generated/tokens.css`. Never edit
that generated CSS directly. `npm run tokens:check` fails when the file has
drifted.

## Aliases

A pure alias inherits its target's type:

```json
{
  "$value": "{primitive.soot-1}",
  "$extensions": {
    "org.lamplight.css": { "property": "--lamp-surface-page" }
  }
}
```

The formatter deliberately emits `var(--lamp-soot-1)` instead of copying the
raw colour. That keeps the public alias graph visible and lets a consumer
override a primitive at the Room boundary.

## Type strategy

Colours, dimensions, durations, numbers, font families, font weights and cubic
Béziers use structured DTCG values. Some valid CSS values cannot be represented
losslessly by those generic types, including compound shadows, gradients,
percentages, borders, URLs and colour functions containing aliases.

Those values use `$type: "string"` and must declare
`$extensions.org.lamplight.css.syntax`. This is a deliberate CSS-bound
classification, not an untyped escape hatch. The strict validator rejects a
CSS-bound value without the extension, an unknown reference, duplicate
property, invalid type shape or alias cycle.

Style Dictionary 5.5.2 is pinned for DTCG ecosystem compatibility. It validates
that the source can enter a standard token toolchain. Lamplight's formatter
remains authoritative where a generic transform would flatten aliases or
change browser-valid CSS.

## Changing tokens

Prefer semantic aliases over new raw values. Add a primitive only when the
material vocabulary genuinely expands. Add a component token only when the
component or documented adapter consumes it. A consumer brand colour or
workflow-specific state belongs in the consumer's extension stylesheet.

A token removal or rename is a breaking change unless it was explicitly
documented as experimental. The pull request must state migration guidance,
regenerate CSS and pass property-parity tests.

## Modes

A token may carry a Day value in `$extensions["org.lamplight.modes"]`. Typed tokens take a compatible alias. CSS-bound strings also accept values matching their declared syntax. The build redeclares dependent aliases in `modes.css` so they resolve in the active scope. Set `data-mode="day"` on a Room or `l-document`.
