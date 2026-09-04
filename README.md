# BetterSantaCruz

BetterSantaCruz is an independent, community-run civic technology project for Santa Cruz, Laguna. It is designed to make public information easier to find while preserving the source, date, and uncertainty behind every local claim.

> BetterSantaCruz is not the official website of the Municipality of Santa Cruz, Laguna and is not operated by the local government unless an explicit partnership is established in the future.

## Status

The project is under local development. Santa Cruz is represented in the BetterLGU ecosystem by upstream [PR #244](https://github.com/jmacj/better-lgu-directory/pull/244), currently **OPEN**, with the maintainer @Diannn3 and status **Planned**. Registration is handled separately; this repository must not create a duplicate directory PR.

The first release is source-led and intentionally incomplete. Empty or “not yet verified” states are safer than copied or guessed civic records.

## What is here

- Config-driven React/Vite foundation based on the BetterLB architecture.
- Kapwa semantic design tokens, responsive UI, and English/Filipino i18n seams.
- Machine-readable source registry and provenance validation.
- Separate seams for civic data, Citizens' Charter services, OpenLGU legislation, transparency, and future review/promotion workflows.
- Documentation of Santa Cruz evidence, gaps, identity safeguards, and Pagsanjan collaboration context.

## What is not claimed

This checkout does not claim current officials, a complete barangay list, municipal office contacts, services, emergency numbers, population, PSGC code, budgets, procurement aggregates, infrastructure status, a municipal address, a domain, a live deployment, or official partnership. Those datasets remain gated until direct, date-appropriate sources are available and reviewed.

## Development

Requirements: Node.js, npm, Python, and Git. From the repository root:

~~~
npm ci
npm run validate:data
npm test -- --run
npm run lint
npm run build
~~~

The inherited OpenLGU and Citizens' Charter scripts are available for future source-backed work, but do not run collection against public sources aggressively and do not promote unreviewed output.

## Repository map

| Path | Purpose |
| --- | --- |
| config/ | Municipality and feature configuration |
| src/data/sources/ | Source registry |
| src/data/ | Schema-compatible civic payloads and empty states |
| src/lib/ | Shared validation/configuration code |
| pipeline/ | Collection, parsing, staging, and reconciliation seams |
| scripts/openlgu/ | Explicit OpenLGU workflow utilities |
| functions/ | Cloudflare Pages/D1 seams, not production-authorized by default |
| e2e/ | Browser and accessibility tests |
| raw_data/ | Selective, immutable public source snapshots only |
| docs/ | Blueprint, architecture, evidence, gaps, and governance notes |

## Source policy

Every civic fact must be traceable to a source ID, title, URL, organization, retrieval date, last-verified date, and verification state. Primary sources outrank secondary sources. Search snippets, blocked pages, volatile BetterGov totals, copied fork data, and same-name municipality matches are not canonical evidence.

See [the source policy](docs/sources/SOURCE_POLICY.md), [the Santa Cruz inventory](docs/sources/SANTA_CRUZ_SOURCE_INVENTORY.md), and [the data gaps](docs/DATA_GAPS.md).

## Contributions

Read [CONTEXT.md](CONTEXT.md), [CONTRIBUTING.md](CONTRIBUTING.md), and [SECURITY.md](SECURITY.md) before contributing. Submit source links and dates with factual changes. Do not add invented values, private personal information, credentials, or claims of municipal authority.

Pagsanjan is a separate effort maintained publicly by @rswlljms. See the [collaboration draft](docs/pagsanjan/COLLABORATION_MESSAGE.md); do not create a competing BetterPagsanjan portal.

## License and attribution

This repository preserves attribution and licensing from the BetterLB foundation. See [LICENSE](LICENSE) and [the ecosystem audit](docs/research/BETTERLGU_ECOSYSTEM_AUDIT.md).
