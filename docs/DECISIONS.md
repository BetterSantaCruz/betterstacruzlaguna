# Decision log

## D-001 — Preserve BetterLB as the architectural base

- Date: 2026-09-04
- Context: The requested project should remain compatible with BetterGov/BetterLGU patterns.
- Alternatives: start from BetterLocalGov, copy BetterPagsanjan, or build a new stack.
- Decision: retain the full BetterLB-derived structure and sanitize civic payloads.
- Reason: it already supplies config, Kapwa, i18n, data modules, OpenLGU seams, Functions, scripts, and tests.
- Consequence: more maintenance surface, but lower ecosystem drift and easier future contribution.
- Revisit when: a measured build/performance/security problem requires a bounded replacement.

## D-002 — Use `betterstacruzlaguna` as the repository name

- Date: 2026-09-04
- Context: “Santa Cruz” is ambiguous across Philippine municipalities.
- Decision: use the province-qualified name for any public repository.
- Reason: reduces collision and identity confusion.
- Revisit when: an existing public repository or BetterLGU governance decision requires another name.

## D-003 — Keep civic payloads empty until verified

- Date: 2026-09-04
- Context: primary PSA/DTI/DILG sources were restricted and local pages had identity/freshness concerns.
- Decision: ship schemas, source registry, empty states, and one verified PhilGEPS identity fact only.
- Reason: missing data is safer than publishing inherited or guessed facts.
- Revisit when: each dataset has direct, date-appropriate primary evidence.

## D-004 — Do not create a second BetterLGU registration PR

- Date: 2026-09-04
- Context: upstream PR #244 already registers Santa Cruz and `@Diannn3` separately.
- Decision: treat PR #244 as the authoritative registration surface; this repo only records its state.
- Reason: duplicate directory changes create governance conflicts.
- Revisit when: the user supplies the merged/current state or explicitly asks for a governed update.

## D-005 — Defer external commitments

- Date: 2026-09-04
- Decision: no domain purchase, external deployment, D1 write, admin activation, or automated outreach in the foundation pass.
- Reason: these actions create external or irreversible commitments not needed to prove the local foundation.

## D-006 — Promote the PSA/DBM civic baseline with explicit scope

- Date: 2026-09-05
- Context: the direct PSA municipality page and 2026 DBM directory were inspectable and identity-matched to Santa Cruz, Laguna.
- Decision: publish the PSA municipality identity, 2024 POPCEN population, 26 barangays, and the DBM-listed mayor and vice mayor; keep all unsupported fields empty or disabled.
- Reason: these records have direct, date-stamped provenance, while a complete officials roster, office directory, services, legislation, finance, and contacts still lack sufficient evidence.
- Revisit when: a newer primary source changes the baseline or a separate corroboration closes one of the remaining data gaps.

## D-007 — Validate promoted records across data files before builds

- Date: 2026-09-05
- Context: the published baseline spans directory and statistics files whose relationships are not expressed by the inherited JSON schemas alone.
- Decision: run canonical-data shape, provenance, identity, and reconciliation checks from `validate:data` before every production build.
- Reason: a valid individual JSON object can still point to the wrong source, municipality, code family, year, or population total when files drift independently.
- Revisit when: a reviewed domain schema replaces or extends the current Santa Cruz-specific baseline validator.

## D-008 — Keep source freshness and identity checks at the registry boundary

- Date: 2026-09-05
- Context: source leads can be structurally valid while being future-dated, non-web links, or same-name municipality matches.
- Decision: reject those conditions in `validateSourceRegistry` before facts or canonical domain records are evaluated.
- Reason: downstream provenance checks should receive a source ledger that is temporally bounded, web-addressable, and identity-safe.
- Revisit when: the registry adds a reviewed non-web evidence type or a versioned source snapshot contract.

## D-009 — Keep published-baseline language separate from gated datasets

- Date: 2026-09-05
- Context: inherited navigation and fallback copy continued to describe all government records as unpublished after the PSA/DBM baseline was promoted.
- Decision: label the verified barangay baseline and two top executives as published, while naming the incomplete council, department, contact, and official datasets as gated.
- Reason: accurate status language is part of the evidence boundary; stale “not published” copy can hide usable records or confuse contributors about what is actually supported.
- Revisit when: a reviewed roster or office dataset changes the public scope.

## D-010 — Preserve direct links for a future static Vercel release

- Date: 2026-09-05
- Decision: commit the Vercel SPA rewrite for the existing `BrowserRouter` application, but keep deployment and domain configuration outside this repository until explicitly authorized.
- Rationale: Vercel's Vite guidance requires a root `vercel.json` rewrite for SPA deep links. The config prevents direct civic routes from falling through to a host-level 404 without asserting that the site is deployed.
- Revisit when: the deployment target changes, the router becomes multi-page/SSR, or a deliberate production release is approved.

## D-011 — Scan runtime surfaces for inherited local claims

- Date: 2026-09-05
- Decision: extend the civic validator to scan publishable page and component source for inherited BetterLB/Los Baños claims, while leaving research and reference documentation retained.
- Rationale: feature-gated routes can still become public later; dormant inherited copy is a clean-room risk even when the current feature flag prevents rendering it.
- Revisit when: the repository adopts a generated content boundary or a more precise static-analysis rule for runtime surfaces.

## D-012 — Reject impossible source chronology

- Date: 2026-09-05
- Decision: require a source's publication date to be no later than retrieval, and its last-verified date to be no earlier than retrieval.
- Rationale: a source ledger is evidence metadata; impossible ordering can make a stale or future observation appear current and should fail before promotion.
- Revisit when: source records gain an explicit observation interval or versioned snapshot timestamps.

## D-013 — Keep civic fact and source states aligned

- Date: 2026-09-05
- Decision: a civic fact's verification state must match the linked source record. Observed facts may remain in the evidence registry, while canonical directory and population records require a verified source.
- Rationale: source observations and restricted leads must remain distinct from canonical public facts without discarding traceable research observations.
- Revisit when: the project introduces an explicit reviewer decision model that separates evidence status from promotion status.
- Status: superseded by D-015. The historical reason for this rule remains useful, but Evidence Model v2 now separates source review, fact verification, and publication state instead of forcing them to match.

## D-014 — Make source-ledger filtering view-only

- Date: 2026-09-05
- Decision: expose municipality, evidence-status, and text filters through a pure source-record helper; filters must not alter registry records or their verification states.
- Rationale: contributors need to isolate evidence classes during research, but the source ledger remains the immutable local description of what was observed.
- Revisit when: the ledger gains server-side pagination or URL-persisted filter state.

## D-015 — Split evidence dimensions instead of overloading verification status

- Date: 2026-09-05
- Context: the legacy `verificationStatus` vocabulary mixed authority (`secondary`), access (`access-restricted`, `unreachable`), review (`pending`), and evidence confidence/promotion (`verified`, `observed`) in one field. This became unsafe before high-volume legislation ingestion.
- Alternatives: retain the legacy enum and add more values; encode publication decisions in UI conditions; or introduce independent dimensions.
- Decision: Evidence Model v2 separates source authority, source access state, source review state, source-ledger visibility, fact verification, assertion type, publication state, and derived freshness metadata.
- Reason: each dimension answers a different question and must be independently testable. A source can be official but blocked, reachable but unreviewed, or reviewed while a particular fact remains staged.
- Consequence: source/fact schemas and source-ledger filters are more explicit; legacy status values are no longer the publication contract.
- Revisit when: a future data class needs an additional orthogonal dimension that cannot be represented by domain-specific policy.

## D-016 — Require positive Santa Cruz identity in every production source

- Date: 2026-09-05
- Context: the old source schema stored only a municipality label/location and the validator supplied `province: 'Laguna'` itself when checking Santa Cruz identity.
- Decision: every production source stores the full Santa Cruz identity envelope, including province Laguna and municipality PSGC `0403426000`, plus how that identity was resolved. Production validation checks the stored identity. The same-name exclusion list remains secondary defense.
- Reason: source identity must be evidence carried by the record, not a fact injected by validation code.
- Consequence: production source records are Santa Cruz-only and can be safely reused by future collectors/staging pipelines.
- Revisit when: the application intentionally becomes multi-LGU, at which point the identity envelope should become a generalized LGU identity contract rather than relaxing the current Santa Cruz invariant.

## D-017 — Keep Pagsanjan research outside BetterSantaCruz production data

- Date: 2026-09-05
- Context: Pagsanjan research was useful during ecosystem discovery, but BetterPagsanjan already has a separate public project/maintainer and should not appear as a normal BetterSantaCruz production source scope.
- Decision: preserve Pagsanjan research under `docs/research/pagsanjan/`, but remove it from the production source registry, public source-ledger filtering, civic validator, and future Santa Cruz search/publication pipeline.
- Reason: municipality boundaries are part of data integrity and project governance. Research retention does not justify public cross-LGU mixing.
- Consequence: production source counts now describe Santa Cruz only; Pagsanjan context remains available for handoff/collaboration without implying ownership.
- Revisit when: a future federated BetterLGU architecture explicitly defines cross-LGU data contracts.

## D-018 — Require field-level provenance for mixed-source civic records

- Date: 2026-09-05
- Context: a domain record may combine fields supported by different sources. The prior executive records used DBM for name/role while also carrying a `2025–2028` term that DBM did not directly establish.
- Decision: domain records can attach source IDs/assertion type at field level. A non-null executive term requires term-specific provenance. Until an authoritative term source is registered, the mayor/vice-mayor term field remains `null`.
- Reason: record-level provenance must not imply that one source supports fields it never stated.
- Consequence: current executive names/roles remain published while unsupported term metadata is withheld.
- Revisit when: a richer generalized claim/provenance graph replaces field provenance without weakening traceability.
