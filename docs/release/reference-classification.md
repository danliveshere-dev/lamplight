# Gate 1 public-reference classification

References were classified by meaning rather than removed blindly.

| Reference | Decision | Rationale |
| --- | --- | --- |
| Daius | retain only in `docs/ORIGIN.md` and release provenance | Honest origin, not a runtime or API dependency |
| tallow, phosphor, ember, hearth | retain | Stable material and semantic colour names in Lamplight's public vocabulary |
| Presence, Orb and FocalCatch | retain provisionally | Their component semantics stand without the original consumer; Gate 2 must confirm API placement |
| consumer domain colour tokens | remove | Host branding belongs in consumer extensions, not core tokens |
| personal assistant, surface and project names | replace | Examples and API prose must be usable without knowledge of the originating system |
| DAS and MLA | do not add | Undefined future consumers or adapters must not shape core implementation prematurely |
| private paths, hosts, ports and personal data | forbid | They have no place in source, packages, examples or public documentation |
