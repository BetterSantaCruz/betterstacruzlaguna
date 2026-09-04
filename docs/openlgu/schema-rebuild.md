# OpenLGU schema and migration boundary

The SQL migrations preserve the reusable OpenLGU schema shape for future source-backed legislative data. They are not a current Santa Cruz data import and must not be treated as permission to mutate a remote database.

## Schema intent

The schema separates:

- terms, persons, memberships, sessions, documents, committees, and attendance;
- raw source records and scrape runs;
- staged document/person candidates;
- review decisions and audit records.

Foreign keys, enum checks, source hashes, and publication/verification states keep unreviewed observations out of canonical records.

## Safe migration rules

- Inspect the exact target and take a reviewed backup before any destructive migration.
- Use an explicitly supplied D1 database name or binding; never rely on a hidden inherited default.
- Apply schema changes locally first and run the API/unit tests.
- Do not import old BetterLB records, raw exports, or synthetic fixtures into the Santa Cruz dataset.
- Do not run a remote command from this repository unless the user has explicitly reviewed that exact operation and target.

The migration helper is intentionally gated. Legacy migration requires BETTERSANTACRUZ_ENABLE_LEGACY_MIGRATION=true and explicit reviewed input artifacts; it is not part of the normal build.

## Local verification

~~~bash
npm run validate:data
npm test -- --run
npx tsc --noEmit
~~~

Review [docs/DATA_MODEL.md](../DATA_MODEL.md), [docs/DATA_GAPS.md](../DATA_GAPS.md), and [source-pipeline.md](./source-pipeline.md) before promoting any record.
