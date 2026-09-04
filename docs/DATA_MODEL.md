# Data model and validation contract

## Source record

The canonical source envelope is implemented in `src/lib/provenance.ts`:

```ts
type SourceRecord = {
  sourceId: string
  sourceTitle: string
  sourceUrl: string
  sourceOrganization: string
  sourceType: string
  location: string
  publishedAt: string | null
  retrievedAt: string
  lastVerifiedAt: string
  municipality: 'Santa Cruz' | 'Pagsanjan'
  categories: string[]
  confidence: 'high' | 'medium' | 'low' | 'unknown'
  verificationStatus: string
  localArchiveFilename: string | null
  notes: string
}
```

`source-registry.json` wraps these records in `{ "sources": [] }` and must have unique source IDs.

## Civic fact

Facts in `src/data/civic-registry.json` are deliberately small and carry the source envelope fields needed to trace each value. A fact is not eligible for publication if its source ID is missing from the registry, its municipality is ambiguous, or its dates are invalid/future-dated.

## Future domain records

Officials, departments, barangays, services, legislation, procurement, projects, statistics, and contacts should use explicit domain schemas plus provenance. A record with no source is a staging candidate, not canonical public data.

## Identity rules

For Santa Cruz, use `Santa Cruz` + `Laguna` + `Region IV-A (CALABARZON)` at minimum. For procurement, prefer the exact organization string `MUNICIPALITY OF SANTA CRUZ, LAGUNA` and any stable upstream agency identifier. Never use municipality-name fuzzy matching by itself.
