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
