# OpenLGU API seam

The OpenLGU route structure is preserved for future source-backed legislative data. The current BetterSantaCruz configuration leaves the feature disabled and publishes no ordinances, resolutions, executive orders, sessions, persons, committees, or attendance figures.

## Data flow

~~~text
reviewed upstream source
  -> immutable observation or fixture
  -> normalized staging candidate
  -> validation and identity checks
  -> review decision with evidence
  -> explicit promotion
  -> canonical record
  -> API/UI
~~~

Collection and staging must not write canonical records directly. A source row is evidence, not a verified document. The Citizens Charter pipeline remains separate from the legislative pipeline.

## Future endpoint shape

If the feature is enabled after review, the existing route seams may expose:

- /api/openlgu/documents
- /api/openlgu/persons
- /api/openlgu/sessions
- /api/openlgu/committees
- /api/openlgu/terms

The handlers must return an empty or unavailable state when the database is not configured. Any populated response must carry or resolve to source/provenance metadata and must not rely on inherited sample fixtures.

## Safe local workflow

~~~
npm run validate:data
npm test -- --run
~~~

Use the scripts under scripts/openlgu/ only with explicit reviewed input paths. Remote D1 operations require an explicitly supplied target and a separate review; no remote target is configured here.
