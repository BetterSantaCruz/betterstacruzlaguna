# Architecture

BetterSantaCruz preserves the BetterLB config-driven React/Vite foundation and its OpenLGU pipeline seams. The repository is intentionally broader than the first release so future contributors can add reviewed datasets without changing frameworks.

## Data flow

```text
upstream source
  -> source observation / optional immutable snapshot
  -> normalized staging candidate
  -> validation + identity disambiguation
  -> review/reconciliation evidence
  -> explicit promotion
  -> canonical public data
  -> UI/API
```

Scrapers and parsers must not write canonical records directly. Initial reconciliation is local; routine Worker sync is a future gate. A source row is evidence, not a trusted document.

## Repository seams

- `config/`: municipality-neutral runtime configuration and feature gates.
- `src/data/`: static UI data; empty arrays/objects are intentional until provenance exists.
- `src/data/sources/`: source registry and provenance metadata.
- `src/lib/`: validation, configuration, search, and shared data boundaries.
- `pipeline/`: source collection, parsing, staging, reconciliation, and review artifacts.
- `scripts/openlgu/`: explicit OpenLGU collection/staging/review utilities inherited from BetterLB.
- `functions/`: Cloudflare Pages/D1 seams; no production write is enabled by this local foundation.
- `e2e/`: browser and accessibility coverage.
- `raw_data/`: selective source snapshots only, never a copy of the BetterLB raw exports.

## Domain separation

The Citizens Charter pipeline is separate from the OpenLGU legislative pipeline. Procurement/transparency discovery is separate from canonical civic records. Source registry entries describe source state, while fact records carry field-level provenance.

## Runtime safety

No domain, coordinates, private API key, official partnership, or municipal contact is assumed. Feature flags hide unavailable modules; route-level empty states prevent a blank screen from being mistaken for a complete dataset.
