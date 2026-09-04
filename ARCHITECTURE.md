# BetterSantaCruz Architecture

BetterSantaCruz preserves the full reusable BetterLB/OpenLGU repository shape while keeping Santa Cruz data, source observations, staging artifacts, review decisions, and canonical public records separate.

The maintained architecture reference is [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The source and data boundary is documented in [docs/DATA_MODEL.md](docs/DATA_MODEL.md), and the current gaps are listed in [docs/DATA_GAPS.md](docs/DATA_GAPS.md).

## Current boundary

- The public civic payload is intentionally sparse until primary-source evidence is reviewed.
- Source records preserve what was observed; they do not automatically become canonical facts.
- Empty states and `DataStatus` notices are preferred to inherited sample records or plausible placeholders.
- OpenLGU collection, staging, reconciliation, review, and migration scripts remain available as reusable architecture, but require explicit reviewed inputs and configured targets.
- Cloudflare/D1, external deployment, admin activation, and routine synchronization are not enabled by the current configuration.

This checkout is an independent project and is not an official Municipality of Santa Cruz website, government system, directory listing, or endorsement.
