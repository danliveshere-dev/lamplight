# Gate 1 public-reference classification

Historical record. This describes the extraction or review target at the time, including its then-pending work. See the [beta.5 publication record](beta-publication.md) for the released source and current launch evidence.

References were classified by meaning rather than removed blindly.

| Reference | Decision | Rationale |
| --- | --- | --- |
| Daius | retain only in `docs/ORIGIN.md`, the internal-package migration guide and release provenance | Honest origin and bounded transition guidance, not a runtime or API dependency |
| tallow, phosphor, ember, hearth | retain | Stable material and semantic colour names in Lamplight's public vocabulary |
| Presence, Orb and FocalCatch | retain provisionally | Their component semantics stand without the original consumer; Gate 2 must confirm API placement |
| consumer domain colour tokens | remove | Host branding belongs in consumer extensions, not core tokens |
| personal assistant, surface and project names | replace | Examples and API prose must be usable without knowledge of the originating system |
| DAS and MLA | do not add | Undefined future consumers or adapters must not shape core implementation prematurely |
| loopback test addresses | retain only in named Gate 4 QA harness files | Public, local-only browser fixtures need a non-routable origin; the privacy allowlist is path-exact |
| private paths, hosts, ports and personal data | forbid | They have no place in source, packages, examples or public documentation |
