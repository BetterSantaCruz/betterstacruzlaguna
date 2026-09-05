# Project status

As of 2026-09-05, BetterSantaCruz is a public, evidence-gated civic information project under active implementation. It remains independent from the Municipality of Santa Cruz and has no production deployment or official municipal endorsement.

## Current verified implementation state

Evidence Model v2 is implemented on PR #7 (`refactor/evidence-model-v2`). The implementation candidate verified green at commit `f56d3eb0c6ff7129b0af88ebc90393bc2c3059d9` with the following remote checks passing on the same implementation state:

- Quality Check;
- Quality Gate;
- Validate JSON Schema;
- GitHub Actions Security Analysis with zizmor;
- BetterSantaCruz E2E.

The civic validator reports **18 Santa Cruz production sources** and **8 civic facts**. The unit suite contains **415 tests**, and the current evidence-gated browser smoke suite contains **15 tests**.

This file may receive later documentation-only commits before PR #7 is merged. Do not substitute a later SHA for the verified implementation SHA above unless its complete remote checks are also inspected.

## Completed foundation

- Fensalir and BetterLGU ecosystem orientation.
- Full BetterLB/OpenLGU-derived architecture retained as reusable structure while inherited civic payloads are sanitized and gated.
- Public repository established at <https://github.com/Diannn3/betterstacruzlaguna>.
- Deterministic Node/install/build prerequisites repaired before the data passes.
- Santa Cruz identity anchored to municipality `Santa Cruz`, province `Laguna`, Region IV-A / CALABARZON, PSGC `0403426000`, and correspondence code `043426000`.
- Controlled public civic baseline retained: PSA/PSGC identity, 2024 POPCEN population `126844`, all 26 barangays with classifications/populations, and the mayor/vice mayor records directly supported by the 2026 DBM directory.
- The unsupported executive term value was removed rather than attributed to a source that does not state it.
- The generated `public/llms.txt` crawler note mirrors the verified-baseline/gated-dataset boundary.
- The population statistics route exposes the verified 2024 snapshot only; unsupported historical trends, CMCI, and municipal-income data remain gated.
- The Vercel SPA rewrite required for future BrowserRouter deep links is retained, but no Vercel deployment is claimed.
- Publishable pages/components are scanned for inherited BetterLB/Los Baños factual leakage.

## Evidence Model v2

Pass B replaces the legacy overloaded `verificationStatus` model with independent evidence dimensions:

- **source authority** — who published the source and what class of authority it has;
- **source access state** — whether the source is reachable, partially rendered, blocked, redirected to authentication, or unreachable;
- **source review state** — whether BetterSantaCruz has reviewed the source for identity/use;
- **source ledger state** — whether the source metadata is permitted in the public ledger;
- **fact verification** — whether a civic assertion is unverified, single-source, corroborated, or disputed;
- **assertion type** — direct, derived, corroborative, or contextual;
- **publication state** — withheld, staged, review-ready, published, superseded, or retracted;
- **freshness metadata** — source dates and review cadence from which freshness is derived.

Production Santa Cruz sources now carry positive municipality identity, including PSGC `0403426000`; validators check the stored identity instead of supplying `Laguna` as proof. Civic facts reference reusable source IDs rather than duplicating the entire source envelope. Field-level provenance is available for domain records whose fields may be supported by different sources.

Pagsanjan collaboration/research material is retained outside the production Santa Cruz source registry. It must not appear as a public BetterSantaCruz source scope or factual search corpus.

## Source ledger

The production ledger now contains Santa Cruz sources only. Its UI and pure filter helpers expose independent filtering by:

- source review state;
- source authority;
- source access state;
- text query.

The current ledger summary is **7 reviewed** and **11 needs-review** sources. Filtering changes only the view; it never mutates evidence state.

## BetterLGU registration

Upstream BetterLGU PR #244 remains the only registration surface for Santa Cruz. Its current external state was rechecked on 2026-09-05:

- PR state: **OPEN**;
- merged: **no**;
- proposed directory status: **🟡 Work in Progress**;
- repository: <https://github.com/Diannn3/betterstacruzlaguna>;
- maintainer: `@Diannn3`.

Do not create a duplicate BetterLGU directory PR and do not claim the entry is merged/live until upstream actually merges it.

## Current data posture

### Published baseline

- municipality identity / PSGC;
- 2024 POPCEN population;
- 26 barangays and their reviewed PSA baseline fields;
- DBM-listed mayor and vice mayor;
- exact PhilGEPS procuring-entity identity fact.

### Still gated

- complete current Sangguniang Bayan roster and ex-officio membership;
- elected-official term metadata not directly sourced by the current evidence;
- departments and department heads;
- institutional office contacts;
- Citizens' Charter and service instructions;
- public legislation corpus;
- emergency contacts;
- finance/FDP/COA datasets;
- broad infrastructure/project status;
- tourism;
- non-population statistics;
- production admin/backend mutation.

## Current next gate

**Pass C — Santa Cruz Sangguniang Bayan legislation source characterization and pilot staging** is the next data pass after Pass B is merged into `main` and the merged state remains green.

Pass C must begin by characterizing how a normal unauthenticated browser receives the ordinance and resolution records from the public SB site. The project must not invent an API endpoint or assume the static HTML table contains the corpus.

Only after transport characterization may the project implement the source-specific adapter and run the bounded deterministic pilot:

- 20 ordinances;
- 20 resolutions;
- recent-year coverage across 2024, 2025, and 2026 where available;
- additional historical parser fixtures for edge cases;
- raw-preserving observations;
- staged records only;
- manual review of all 40 pilot records;
- **0 automatic canonical/public legislation records**.

OpenLGU public activation, D1 writes, bulk historical ingestion, and deployment remain outside that pass.

## Current blockers

There is no known Pass B engineering blocker at the verified implementation state. Remaining work before Pass C is governance of the transition: finalize truthful Pass B documentation, verify the final PR checks, merge PR #7, then re-check the merged `main` state.

After that, the principal uncertainty is a **source-transport/data-characterization question**, not permission to fabricate or publish missing data.

## Not yet claimed

- production domain or deployment;
- official partnership, municipal ownership, or endorsement;
- BetterLGU Active status;
- merged BetterLGU PR #244;
- completeness of any gated dataset;
- Pagsanjan ownership or co-maintainership;
- publication of the Santa Cruz legislation corpus.
