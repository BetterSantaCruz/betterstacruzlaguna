# OpenLGU source pipeline

BetterSantaCruz preserves the full source-intake, staging, reconciliation, and review structure so future legislative data can be added without bypassing evidence controls. The current configuration publishes no legislative records.

## Data flow

~~~text
reviewed source definition or fixture
  -> source observation with content hash
  -> normalized staging candidate
  -> validation and identity checks
  -> review decision with evidence
  -> explicit promotion
  -> canonical D1 record, only after approval
~~~

The Citizens Charter/service pipeline is separate from the legislative pipeline. Scrapers and parsers must never write canonical records directly.

## Reviewed inputs

Collectors do not contain a default municipality, source URL, term list, Facebook export, or inherited fixture path. Supply reviewed inputs explicitly:

- Website collection: a JSON file passed with --source-config or BETTERSANTACRUZ_SOURCE_CONFIG.
- Manual CSV conversion: a path passed with --input or BETTERSANTACRUZ_MANUAL_SOURCE_INPUT.
- Facebook parsing: a normalized fixture directory passed with --input-dir or BETTERSANTACRUZ_FACEBOOK_INPUT_DIR.
- Term snapshots: reviewed JSON passed with --input or BETTERSANTACRUZ_TERMS_INPUT.
- Document staging: reviewed source-record JSONL and term JSON passed with --input and --terms.
- Shadow reconciliation and diffing: reviewed staged/output paths passed explicitly.

The website collector configuration must identify the source key, label, absolute HTTP(S) URL, document type, table selector, column mappings, and any reviewed fallback selectors. A source URL being reachable does not make its rows canonical.

## Local sequence

Run from the repository root after reviewing each input:

~~~bash
node scripts/openlgu/collect-website-source-records.cjs --source-config path/to/reviewed-sources.json
node scripts/openlgu/collect-source-records.cjs --input path/to/reviewed-documents.csv
node scripts/openlgu/collect-facebook-posts.cjs --input-dir path/to/reviewed-facebook-fixtures
node scripts/openlgu/generate-term-snapshot.cjs --input path/to/reviewed-terms.json
node scripts/openlgu/stage-documents.cjs --input path/to/source-records.jsonl --terms path/to/terms.json
node scripts/openlgu/reconcile-shadow.cjs --staged-documents path/to/staged-documents.jsonl
node scripts/openlgu/diff-source-records.cjs --output-root path/to/reviewed-source-output
~~~

All generated pipeline artifacts belong under the ignored pipeline workspace unless a snapshot has been deliberately selected for publication. The current repository does not include municipal legislative fixtures.

## Evidence and review states

Keep these states distinct:

- pending: collected but not reviewed;
- access-restricted: a source could not be inspected;
- unreachable: a source request failed;
- observed: a value was seen but not corroborated;
- verified: a value passed the project’s source and identity checks;
- disputed: sources conflict and need a decision;
- cannot_determine: evidence is insufficient for promotion.

Each promoted field must retain its source record, source URL, content hash, retrieval/verification dates, and review evidence. Same-name municipality matches require province/region or an agency identifier.

## Database loading boundary

The load-pipeline-to-d1 script requires an explicit pipeline directory and uses BETTERSANTACRUZ_DB (or an explicit binding override). A remote load requires an explicitly named remote target and a separately reviewed operation. No remote target is configured by this repository.

Never put cookies, access tokens, authorization headers, private exports, or personal data into source fixtures or committed snapshots.
