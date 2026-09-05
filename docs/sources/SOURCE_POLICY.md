# Source and provenance policy

BetterSantaCruz is source-led. Reachability, official branding, source authority, project review, fact verification, and public publication are deliberately separate concepts.

A page being reachable, branded as official, or indexed by a search engine is not enough to make its content canonical.

## Production municipality boundary

Production civic sources must resolve positively to:

- Municipality: Santa Cruz
- Province: Laguna
- Region: Region IV-A / CALABARZON
- PSGC: `0403426000`

Every production source record stores this identity. The validator checks the stored identity rather than injecting the province during validation.

The same-name exclusion list remains a regression defense, but positive identity using province/PSGC/official identifiers is the primary rule.

Pagsanjan research is stored outside the production registry under `docs/research/pagsanjan/` and must not be imported into the public BetterSantaCruz application or civic-data pipeline.

## Required source record

Every production source records:

- stable `sourceId`;
- source organization/title/type;
- source URL;
- explicit Santa Cruz identity envelope;
- how municipality identity was resolved;
- source categories;
- source authority class;
- access state and last access check;
- project review state;
- source-ledger visibility;
- publication/update date when available;
- retrieval and last-verification dates;
- optional archive filename/hash;
- notes describing limitations and anomalies.

## Source authority

| Authority | Meaning |
| --- | --- |
| `primary-official` | Responsible government body or official government publishing system |
| `secondary-reputable` | Reputable third-party source used for corroboration/context |
| `civic-index` | Civic-tech index/aggregation layer such as BetterGov |
| `community` | Community project/governance/collaboration source |
| `unknown` | Authority not yet sufficiently established |

Authority does not determine whether a page was reachable or whether a specific fact may be published.

## Access state

| Access state | Meaning |
| --- | --- |
| `not-checked` | No current access observation is recorded |
| `reachable` | Required source content could be inspected |
| `partially-rendered` | Source/page loaded but required data/query was incomplete or client-rendered |
| `blocked` | Access was blocked/restricted for the required content |
| `auth-redirect` | Public request redirected to authentication |
| `unreachable` | Source could not be reached during the recorded check |

A blocked or unreachable authoritative source remains blocked/unreachable. It must not be silently replaced with a lower-tier snippet.

## Source review state

| Review state | Meaning |
| --- | --- |
| `unreviewed` | Source is known but project review has not occurred |
| `needs-review` | Source/usefulness/identity/freshness still has a material review requirement |
| `reviewed` | Source has been reviewed for the recorded scope/use |
| `rejected` | Source was reviewed and rejected for project use |

Reviewing a source does not automatically verify all facts contained by that source.

## Source-ledger visibility

`listed` means source metadata may appear in the public source ledger.

`withheld` means the source should not be surfaced publicly through the normal source ledger.

A listed source is not a published civic fact.

## Civic fact evidence

Facts reference source IDs rather than duplicating source title/URL/organization metadata.

### Verification state

| State | Meaning |
| --- | --- |
| `unverified` | Candidate/observation only |
| `single-source` | Supported by one reviewed source |
| `corroborated` | Supported by multiple compatible sources |
| `disputed` | Material source conflict exists |

A direct fact from one reviewed primary official source can be publication-eligible. `single-source` is a description of evidence count/state, not a quality downgrade by itself.

### Assertion type

| Type | Meaning |
| --- | --- |
| `direct` | Source directly states the value/claim |
| `derived` | Project computes the claim from source-backed inputs |
| `corroborative` | Supporting evidence confirms another source-backed claim |
| `contextual` | Research/context only; not a basis for public factual publication by itself |

## Publication state

| State | Meaning |
| --- | --- |
| `withheld` | Not eligible for public display |
| `staged` | Parsed/recorded candidate, not public |
| `review-ready` | Candidate has passed automated checks and awaits publication review |
| `published` | Explicitly approved by publication policy |
| `superseded` | Historical record replaced by a later record while retained for history |
| `retracted` | Previously published record deliberately withdrawn |

Collectors never write directly to `published` data.

## General publication rules

- Empty or `Unknown / not yet verified` states are valid public outcomes.
- A source observation is not a canonical civic fact.
- Same-name municipalities must be positively disambiguated with province/PSGC/official identifiers.
- Published facts must reference existing reviewed evidence.
- A `single-source` published fact currently requires a reviewed `primary-official` source.
- `unverified`, `disputed`, and `contextual` facts are not normal public civic facts.
- Search/index snippets are discovery evidence only unless the original source is inspected.
- BetterGov aggregate totals are volatile civic-index data; store the index/source link rather than an unqualified static total.
- Emergency contacts and service instructions require stricter freshness/review policies than historical legislation.
- Legal/service wording must preserve the original source and must not be silently machine-rewritten into authoritative instructions.
- Missing information must not be inferred merely to fill a page.

## Field-level provenance

When different fields come from different sources, provenance must be attached at field level.

For example, the 2026 DBM directory directly supports the currently listed mayor/vice-mayor names and roles. It does not directly establish a `2025–2028` term interval, so that term is withheld until an authoritative source supports it.

## Freshness

Source/fact records store the underlying dates needed to derive freshness:

- last verified date;
- optional review cadence;
- optional validity/effective interval.

Freshness labels are derived, not manually asserted.

A stale high-risk record may be withheld even if it was once valid.

## Source -> observation -> publication boundary

High-volume civic datasets use the following lifecycle:

```text
source registry
  -> retrieval/collection activity
  -> raw observation
  -> normalization
  -> identity/schema validation
  -> staging
  -> reconciliation/conflict review
  -> publication decision
  -> canonical published record
```

No collector is allowed to turn a network response directly into a public record.

## Snapshot policy

`raw_data/` remains reserved for selectively retained reviewed public source snapshots. Preserve original filenames and checksums when archival storage is appropriate. Do not modify archival files.

Large/volatile collection runs should use ignored `pipeline/` storage. Commit only reviewed fixtures, schemas, configuration, and reports needed for reproducibility.

Blocked pages, volatile indexes, and sources for which local archival copying is inappropriate remain represented by metadata rather than fabricated snapshots.

## Santa Cruz SB source policy

The Sangguniang Bayan site currently has a visible `Lumban Logo` branding/template anomaly. That anomaly must remain documented.

It is not treated as proof that the entire domain is invalid. Instead:

- source identity is resolved positively to the reviewed Santa Cruz/PSGC baseline;
- legislation sources remain `needs-review` while transport/coverage is characterized;
- legislation may enter staging after controlled collection;
- no legislative observation is automatically published;
- raw labels, titles, authors, tags, dates, and document states must be preserved.

## Governance gates

No source-policy change implies:

- municipal partnership or endorsement;
- production D1/KV write access;
- production admin activation;
- public deployment;
- BetterLGU status change;
- automatic civic-data promotion.

Ambiguous evidence/identity/publication decisions require explicit review rather than agent inference.
