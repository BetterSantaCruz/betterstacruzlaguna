# BetterSantaCruz API seams

This directory documents the API boundaries retained from the reusable OpenLGU architecture. It is not a claim that BetterSantaCruz has a public API, deployed domain, active admin system, or populated municipal database.

## Current state

- /api/weather is deliberately disabled and returns 503 FEATURE_NOT_CONFIGURED.
- /api/lgu-news returns an explicit empty, not-configured response.
- OpenLGU and admin handlers are implementation seams. They require explicit local configuration, reviewed inputs, and a configured database before they can serve data.
- No remote D1/KV target, OAuth application, API key, or public base URL is configured in this repository.

## Data contract

Any future public civic response must preserve:

- the source record ID and source URL;
- retrieval and last-verified dates;
- source organization and title;
- verification state;
- identity disambiguation for same-name municipalities;
- the difference between observed, pending, access-restricted, unreachable, and verified material.

Empty responses are the correct result when a feature has no reviewed data. Do not use BetterLB fixtures, sample rows, search snippets, or volatile aggregates as Santa Cruz records.

## Related references

- Source policy: ../sources/SOURCE_POLICY.md
- Data model: ../DATA_MODEL.md
- OpenLGU source pipeline: ../openlgu/source-pipeline.md
- Function boundary: ../../functions/README.md
