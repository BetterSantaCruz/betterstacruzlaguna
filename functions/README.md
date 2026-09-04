# BetterSantaCruz Pages Functions

This directory preserves the Cloudflare Pages Functions and D1 seams from the reusable OpenLGU architecture. The current Santa Cruz configuration does not activate a production backend.

## Current behavior

- Weather endpoints return `503 FEATURE_NOT_CONFIGURED`; they do not call an external weather provider.
- The news endpoint returns an explicit empty, not-configured response.
- OpenLGU/admin routes remain available as implementation seams but require an explicitly configured local or remote database and reviewed inputs.
- No D1, KV, deployment, admin activation, or routine synchronization is implied by this checkout.
- API responses must not introduce municipal facts without a source record and verification state.

## Local development

Use the repository's normal checks before exercising a function:

```bash
npm run validate:data
npm test -- --run
npx wrangler pages dev dist
```

Do not point a command at a remote database unless the target is explicitly supplied and the operation has been reviewed. Keep credentials in local environment configuration; never commit them.

## Adding a function

1. Add a focused test or harmless probe first.
2. Keep external requests and writes behind explicit configuration.
3. Preserve source/provenance fields when moving observed data through staging.
4. Update the relevant API documentation and run the full quality gate.
