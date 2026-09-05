# Santa Cruz, Laguna source inventory

Checked: 2026-09-05. The registry at `src/data/sources/source-registry.json` is the machine-readable source of record. This document explains what was and was not imported.

## Tier 1 / primary sources

| Source | Observed state | Use in this build |
| --- | --- | --- |
| [PhilGEPS notice 11459794](https://notices.philgeps.gov.ph/GEPSNONPILOT/Tender/PrintableBidNoticeAbstractUI.aspx?refid=11459794) | Reachable notice whose procuring entity is exactly `MUNICIPALITY OF SANTA CRUZ, LAGUNA`; the notice is a 2024 drainage-canal procurement record | One verified identity/procurement fact only; no current procurement aggregate is inferred |
| [Sangguniang Bayan site](https://sbstacruz.com/) | Reachable public legislative site with About, Contact, Citizens' Charter, Ordinances, and Resolutions pages | Source discovery and observed leads; its pages show a `Lumban Logo` branding anomaly, so local claims remain uncorroborated |
| [Sangguniang Bayan About](https://sbstacruz.com/aboutUs) | Reports 26 barangays and approximately 3,860 hectares | Observed lead only; no barangay names or area claim is canonical |
| [Sangguniang Bayan Contact](https://sbstacruz.com/contact) | Displays public institutional contact/office details | Observed/source-reported only; no contact is promoted as current municipal support |
| [Citizens' Charter page](https://sbstacruz.com/citizens-charter) | Table was empty during inspection; page displayed local emergency numbers without a freshness stamp | No service or emergency record imported |
| [Ordinances](https://sbstacruz.com/ordinances) | Large table including 2026 entries and linked PDFs | No legislative rows imported yet; future intake must throttle/cache and preserve source rows |
| [Resolutions](https://sbstacruz.com/resolutions) | Large table; one first-row date/number combination appeared future-dated relative to the research date | No rows imported; anomaly is recorded as a review concern |
| [DTI CMCI profile](https://cmci.dti.gov.ph/lgu-profile.php?lgu=Santa+Cruz+%28LA%29) | Authoritative profile URL, access-restricted during this pass | No mayor, population, rank, or website/email snippet imported |
| [PSA PSGC municipality page](https://psa.gov.ph/classification/psgc/barangays/0403426000) | Directly inspectable Santa Cruz, Laguna page with PSGC `0403426000`, correspondence code `043426000`, 2024 POPCEN population `126844`, and 26 barangays as of 31 July 2025 | Verified baseline: municipality identity, population, and each barangay's code/classification/population |
| [DILG FDP report interface](https://fdpp.dilg.gov.ph/fdpp/report/index) | Public interface loaded, exact Santa Cruz filter was unavailable/redirected | No FDP budget or disclosure record imported |
| [COA archive](https://www.coa.gov.ph/index.php/reports/archive/annual-audit-reports-archive) | Archive lead; no exact Santa Cruz record was verified in this pass | Discovery only |
| [DBM 2026 directory](https://www.dbm.gov.ph/wp-content/uploads/AboutDBM/2026-Philippine-Government-Directory-of-Agencies-and-Officials.pdf) | 2026 government directory lists Joseph Kris Benjamin B. Agarao as mayor and Laarni A. Malibiran as vice mayor | Verified top-executive records only; not a complete officials or department roster |
| [DPWH municipal-hall planning document](https://www.dpwh.gov.ph/dpwh/sites/default/files/GAA/APP/market_scoping_-_rehabilitation_of_municipal_hall_of_santa_cruz_laguna.pdf) | Market-scoping document for proposed municipal-hall rehabilitation with preliminary ABC and duration | Planning evidence only; no award, construction, or completion claim |
| [NAPOLCOM CALABARZON](https://www.napolcom.gov.ph/calabarzon/) | 2026 public-safety event report corroborates the mayor's name in context | Observed corroboration only; not a complete office directory |
| [COMELEC 2025 candidate list](https://www.comelec.gov.ph/php-tpls-attachments/2025NLE/TFKKKH/Approved_ROCP_LOCAL/R4A/LAGUNA.pdf) | Official approved local candidate list for Laguna, including Santa Cruz | Observed election-source context; not a certified winner/current-officeholder roster |

## Tier 2 / BetterGov sources

- [BetterGov Transparency Portal](https://transparency.bettergov.ph/) exposes an exact organization route for [MUNICIPALITY OF SANTA CRUZ, LAGUNA](https://transparency.bettergov.ph/organizations/MUNICIPALITY%20OF%20SANTA%20CRUZ%2C%20LAGUNA). Its public index is useful for discovery, but counts and amounts are volatile and are not hard-coded.
- The BetterLGU Directory [PR #244](https://github.com/jmacj/better-lgu-directory/pull/244) is a governance/collaboration source, not a municipal source. It is currently open, records `@Diannn3`, and shows `🔵 Planned`.

## Excluded or unresolved identity

- `https://stacruz.gov.ph` was excluded: it is a different Santa Cruz in Davao del Sur.
- Search snippets and blocked DTI results are not used as canonical evidence. The directly inspectable PSA municipality page supplies the current verified baseline.
- The verified baseline publishes the PSA identity/population/26-barangay records and the two DBM-listed top executives. No complete current officials roster, office directory, official municipal address, Citizens' Charter, emergency contact, budget, audit finding, or infrastructure status is published by this foundation yet.

## Research next actions

1. Confirm the official municipal portal and current first-party contacts through a durable government source.
2. Obtain an authoritative complete officials/department roster and corroborate election-year records.
3. Review legislative tables one source at a time with caching/throttling, preserving raw rows and linked documents.
4. Locate a current official Citizens' Charter or ARTA-hosted copy before creating service records.
5. Resolve BetterGov/PhilGEPS identifiers before exposing procurement or finance dashboards.
