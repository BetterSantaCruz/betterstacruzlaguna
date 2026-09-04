# BetterLGU ecosystem audit

Research date: 2026-09-04

This is an implementation audit, not an endorsement of every inherited record. Public repositories were inspected for architecture, data boundaries, source attribution, deployment, contribution flow, and maintenance burden.

## Projects inspected

| Project | What was useful | Boundary or risk |
| --- | --- | --- |
| [BetterLGU Directory](https://github.com/jmacj/better-lgu-directory) | Simple directory governance, explicit Planned/WIP/Active states, maintainer ownership | Directory registration is a separate governance surface; do not duplicate entries or imply directory approval is municipal approval |
| [BetterLB](https://github.com/BetterLosBanos/betterlb) | Config-driven React/Vite foundation, Kapwa design system, static data modules, Cloudflare Functions/D1 seams, source-aware OpenLGU pipeline, tests and scripts | Large inherited surface; Los Baños facts, branding, raw exports, and default URLs must never cross into Santa Cruz |
| [BetterSolano](https://github.com/BetterSolano/bettersolano) | Early community portal patterns and static civic content | Legacy hybrid/static structure and broad factual payloads increase freshness and provenance risk |
| [BetterLocalGov](https://github.com/iyanski/betterlocalgov) | React/Vite/TypeScript starter, localization and content separation, approachable contributor surface | Starter architecture does not replace a source/reconciliation model |
| BetterCalauan | Shows how a Laguna fork can reuse BetterSolano-style structure | Legacy fork patterns and copied content need source-by-source review |
| BetterCabuyao | BetterLocalGov-derived React/Vite/Tailwind structure and content files | Empty or copied starter content can look authoritative without provenance |
| BetterSanPablo | BetterLocalGov-derived structure with i18n and content/data separation | Same source-freshness and copied-template risks; no evidence to treat it as a canonical data source |
| BetterCalamba | More complete BetterLB-like fork with deployment configuration | Scale and deployment files do not prove data currency or publication readiness |
| [BetterPagsanjan](https://github.com/rswlljms/betterpagsanjan) | Small Next.js source-aware project, visible disclaimer, source registry, explicit empty/pending states | Existing maintainer `@rswlljms` must not be displaced; use for collaboration and handoff, not as a competing public portal |

## Foundation decision

Use BetterLB as the primary architectural base. It is the closest match to the requested BetterGov/BetterLGU ecosystem and already separates configuration, civic data, services, transparency, functions, pipeline stages, and tests. The full directory structure is intentionally retained in this checkout.

The choice does **not** mean its factual content is reusable. BetterSantaCruz replaces the identity/configuration, branding, civic payloads, source ledger, and publication gates while preserving reusable code and schemas.

## Patterns retained

- `config/lgu.config.json` for identity and feature gates.
- `src/data/` for typed, inspectable static data and schema-compatible empty states.
- `src/data/sources/source-registry.json` for source-level provenance.
- BetterLB's separate Citizens Charter and OpenLGU legislative boundaries.
- Local-first collection, staging, reconciliation, review, and later promotion seams.
- Kapwa semantic design tokens, i18n structure, responsive components, and existing unit/E2E harnesses.
- Cloudflare Functions/D1 integration points as disabled/future infrastructure until a verified dataset and security review exist.

## Anti-patterns explicitly rejected

- Copying Los Baños officials, barangays, service requirements, addresses, budgets, coordinates, or tourism listings into Santa Cruz.
- Treating a search snippet, blocked source, copied fork, or BetterGov aggregate as a stable canonical fact.
- Publishing a municipality-wide directory from an unverified table merely because it has many rows.
- Hard-coding a domain, official partnership, social account, emergency number, or current officeholder.
- Enabling Meilisearch, D1 writes, admin workflows, or recurring collection before the corpus and abuse/security gates are ready.
- Creating another BetterLGU registration PR. Santa Cruz is already represented by upstream PR [#244](https://github.com/jmacj/better-lgu-directory/pull/244), which is currently open and human-managed by `@Diannn3`.

## MVP recommendation

The first working application should be a fast, independent civic shell with:

1. clear non-official disclaimer;
2. source ledger and verification-state display;
3. search/navigation over only verified or explicitly observed content;
4. honest empty states for services, government directory, barangays, legislation, statistics, tourism, and finance where data is not yet ready;
5. contribution/reporting guidance without collecting unnecessary personal information.

Feature flags and route-level empty states are preferable to plausible sample data. The next expansion should be source-backed legislation and Citizens Charter intake, each with a separate review/promotion gate.

## Verification note

This audit records the structure observed on 2026-09-04. Repository branches, deployment services, and upstream source pages can change; re-check before a release or collaboration handoff.
