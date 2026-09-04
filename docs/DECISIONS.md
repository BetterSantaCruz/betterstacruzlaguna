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
