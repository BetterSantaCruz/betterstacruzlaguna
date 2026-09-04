# Source and provenance policy

BetterSantaCruz is source-led. A page being reachable, branded as official, or indexed by a search engine is not enough to make its content canonical.

## Required source record

Every source entry records:

- stable `sourceId`;
- source organization and title;
- original URL/location and source type;
- municipality scope;
- categories covered;
- publication/update date when available;
- retrieval and last-verification dates;
- confidence and verification status;
- optional local archive filename;
- notes describing limitations and anomalies.

Important civic facts additionally carry their source ID, title, URL, organization, publication date, retrieval date, last verification date, and verification status in the fact record.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `verified` | Directly checked against an authoritative source with enough evidence for the stated claim |
| `observed` | Seen at the cited source but still needs corroboration, freshness review, or identity review |
| `pending` | A candidate is known but not ready for public factual use |
| `access-restricted` | The source is authoritative or relevant, but the required page/query could not be inspected |
| `unreachable` | The URL could not be reached during the recorded check |
| `discovery-only` | A lead used to guide research; no civic fact was imported |
| `secondary` | Supporting context, never the sole basis for an important local fact |
| `collaboration` | A public project or maintainer record used for coordination, not municipal authority |

## Publication rules

- Empty or `Unknown / not yet verified` states are valid public outcomes.
- Do not promote a source observation into a canonical record without reviewing its municipality identity and freshness.
- Same-name municipalities must be disambiguated with province, region, PSGC, agency identifier, or exact procuring-entity name wherever available.
- A blocked or unreachable authoritative source remains recorded as blocked/unreachable; it is not replaced silently with a lower-tier snippet.
- BetterGov totals and search results are volatile discovery/index data. Store the source link and retrieval state, not an unqualified static aggregate.
- Emergency and contact records require a current last-verified date and stricter review than historical context.
- Legal/service language must retain the original source link and should not be machine-translated into authoritative instructions without review.

## Snapshot policy

`raw_data/` is for selectively retained public source snapshots only. Preserve original filenames and checksums when an archive is legally and technically appropriate. Do not modify archival files. Blocked pages, volatile indexes, and pages with no permitted local archive remain represented by registry metadata rather than copied payloads.

## Human gates

No external message, domain purchase, municipal partnership claim, D1 write, admin activation, public deployment, or directory update is implied by this policy. Human review is required where evidence, identity, or governance is ambiguous.
