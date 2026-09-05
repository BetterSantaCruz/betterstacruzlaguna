# Santa Cruz SB legislation source characterization

Characterization date: **2026-09-05**

Scope: public ordinance and resolution pages of the Sangguniang Bayan website for **Santa Cruz, Laguna**. This is a source-transport characterization for BetterSantaCruz Data Pass C. It is not a completeness claim and does not publish legislation into the production civic dataset.

## Safety and method

The characterization used a normal, fresh, unauthenticated Playwright browser context against:

- `https://www.sbstacruz.com/ordinances`
- `https://www.sbstacruz.com/resolutions`

No login was performed. No credentials, cookies, CSRF tokens, authorization headers, or private request headers were persisted. The interaction probe used only controls visible on the public pages: initial load, one visible **Next** pagination action, a 2024 date range, a number input probe, a title input probe, and the first non-empty tag option.

The browser-captured transport, rather than a guessed endpoint, is the basis for the source-specific adapter.

## Page identity

The public pages returned HTTP 200 and identify the site as Santa Cruz, Laguna. The normal page title observed during the initial characterization was:

> `Santa Cruz Laguna | Official Website of the Sangguniang Bayan`

The page body exposed the identity markers `Santa Cruz`, `Laguna`, and `Republic of the Philippines`.

A known branding anomaly remains: the page contains an image alt value identifying a **Lumban Logo**. BetterSantaCruz therefore does not use branding alone as municipality proof. The project keeps its independent municipality identity gate anchored to Santa Cruz, Laguna and PSGC `0403426000`.

## Public data transport

Both public pages initialize a server-side DataTables request using unauthenticated HTTP **GET** requests returning `application/json`:

| Public page | Browser-observed data endpoint |
| --- | --- |
| `/ordinances` | `/ordinancesData` |
| `/resolutions` | `/resolutionsData` |

The endpoint response shape observed by the browser is a DataTables-style object containing:

- `draw`
- `recordsTotal`
- `recordsFiltered`
- `data`

Each returned `data` row is a seven-element array. The public table semantics observed by the page and row parser are:

1. upstream numeric row ID;
2. Details metadata (`Type`, `Number`, `Category`);
3. Title;
4. Sponsor metadata;
5. Tags;
6. Approved date;
7. Action/document control.

The upstream numeric ID is treated as a **source-native record identifier**, not as an ordinance/resolution number and not as proof of a legal identifier by itself.

## Ordering and pagination

The normal browser requests used:

- `order[0][column]=3`
- `order[0][dir]=desc`
- initial `start=0`
- initial `length=10`

Activating the visible **Next** pagination control produced the same public endpoint with:

- `start=10`
- `length=10`

The sampled source-native IDs differed between the first and second visible pages for both document types, establishing that the public `start` offset is actually used by the DataTables transport.

Point-in-time source totals observed during the interaction run were:

- ordinances: `recordsTotal = 600`
- resolutions: `recordsTotal = 10100`

These values are transport observations only. They may change upstream and are **not** published by BetterSantaCruz as canonical counts.

## Date filtering

The public date controls were observed to map directly to the query parameters:

- `from_date`
- `to_date`

Using the visible controls for `2024-01-01` through `2024-12-31` produced HTTP 200 DataTables responses with both parameters present.

For that bounded 2024 date window, the interaction run observed:

| Type | `recordsFiltered` | First sampled source-native IDs |
| --- | ---: | --- |
| Ordinances | 16 | `91662`, `91477`, `91476`, `91440`, `92033` |
| Resolutions | 550 | `91648`, `91649`, `91650`, `91651`, `91652` |

The sampled Details metadata in the bounded 2024 responses also carried 2024 ordinance/resolution labels. This is sufficient to use the **public date-range mechanism** for a bounded deterministic pilot-selection workflow, with exact IDs recorded and rechecked before staging.

A lower-bound-only probe (`from_date=2024-01-01`, empty `to_date`) returned newer records as expected, so BetterSantaCruz will not treat a single-sided lower bound as a 2024-only selector.

## Tag filter

Selecting the first non-empty public tag option produced the browser-observed query parameter `tagFilter=1` and reduced `recordsFiltered` for both document types. This confirms the tag filter participates in the public DataTables request.

The numeric tag value is an upstream UI value. BetterSantaCruz does not assign it a semantic label unless that label is separately observed and preserved.

## Number and title controls

The interaction script could fill the public number and title controls, but those two probes did **not** produce a captured XHR/fetch request under the event sequence used in this run. Their server-side request semantics are therefore **not characterized** by this pass and must not be assumed by the collector.

Pass C does not need those controls for its 2024/2025/2026 pilot, so the collector will use only the date-filter behavior that was directly observed.

## Source-native IDs and repeatability

Repeated 2024 date-range requests in the same browser session returned the same sampled source-native IDs and filtered counts. The pilot therefore records explicit upstream IDs and fails closed if a later bounded rerun does not return the expected IDs.

A content hash remains separate from source-native/logical identity. An upstream metadata edit should create a new observation version without silently creating a new legal-document identity.

## Authentication and access controls

The public pages and DataTables requests succeeded without login in the characterization environment. No authenticated route was used and no access-control bypass was attempted.

The characterization did **not** intentionally provoke 403 or 429 responses against the live site. Those failure modes are covered with mocked collector tests. The live collector policy is to:

- use concurrency 1;
- keep at least 2.5 seconds between live requests;
- use a 30-second request timeout;
- stop on HTTP 403;
- honor a bounded `Retry-After` on HTTP 429 and stop on repeated/unbounded rate limiting;
- use bounded retries for transient server/network failures;
- never rotate proxies or user agents to evade controls.

## Document/action behavior

The source-specific parser preserves the exact Action cell and link as raw evidence. It distinguishes a public PDF from `Request a Copy`/metadata-only behavior rather than interpreting every link as a downloadable document.

The final 40-record pilot report must summarize the actual document states observed in the selected records.

## Collection decision for Pass C

**Chosen mode: `public-json`, captured from normal unauthenticated browser traffic.**

Pass C may use the two browser-observed DataTables endpoints for a small reviewed staging pilot because:

- the endpoints are requested by the public page itself;
- requests are unauthenticated;
- the response shape is understood;
- visible pagination is represented by `start`/`length`;
- the required date-range behavior is directly characterized;
- stable source-native row IDs are exposed;
- the collector is bounded, throttled, and staging-only.

This decision does **not** authorize a full historical crawl. After the deterministic 20 ordinance + 20 resolution pilot and manual/project review, Pass C stops for a scale-up decision.

## Remaining limitations before any scale-up

The following are intentionally unresolved or only partially characterized:

- full-corpus pagination completeness across all ~10k resolution rows;
- semantics of the DataTables ordering column beyond the exact browser-observed parameter;
- number/title server-side filter event semantics;
- whether upstream numeric IDs are permanent across future site migrations;
- long-term disappearance/version behavior;
- complete public-file coverage versus `Request a Copy` records;
- historical duplicate/language-variant relationships.

None of those limitations block the bounded Pass C pilot, but they prevent BetterSantaCruz from calling the source a complete, canonical legislation dataset.
