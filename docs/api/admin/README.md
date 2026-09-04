# Admin API seam

The admin route structure is retained for the local review workflow. BetterSantaCruz has no public admin deployment or configured OAuth application in this repository.

## Current safety boundary

- Admin handlers must fail closed when allowlists, OAuth credentials, session storage, or the database are absent.
- State-changing requests require authentication, authorization, CSRF protection, source-hash checks, and audit logging.
- Public repository access must never grant database access.
- Do not place cookies, tokens, client secrets, session IDs, or authorization headers in source files, fixtures, logs, or source snapshots.
- No remote D1/KV target is configured; local review artifacts are the default.

See authentication.md for the narrow OAuth/CSRF contract and functions/README.md for the backend boundary.
