# Data model and validation contract

BetterSantaCruz uses an evidence-gated data model. A source being reachable or official-looking is not the same thing as a civic fact being reviewed, and a reviewed source is not automatically permission to publish every claim found there.

## Evidence Model v2

The canonical evidence primitives live under `src/lib/evidence/` and are re-exported from `src/lib/provenance.ts` for compatibility.

The model intentionally separates dimensions that were previously overloaded into one `verificationStatus` field.

### Source authority

```text
primary-official
secondary-reputable
civic-index
community
unknown
```

This answers who published the source and how authoritative that source class is.

### Source access

```text
not-checked
reachable
partially-rendered
blocked
auth-redirect
unreachable
```

This answers whether and how BetterSantaCruz could inspect the source. Access state does not determine truth or authority.

### Source review

```text
unreviewed
needs-review
reviewed
rejected
```

This answers whether BetterSantaCruz has reviewed the source identity and intended use.

### Source-ledger visibility

```text
withheld
listed
```

A listed source may appear in the public source ledger. This still does not mean facts from it are published.

### Fact verification

```text
unverified
single-source
corroborated
disputed
```

A single authoritative primary source can be sufficient for some direct claims. `single-source` therefore does not mean low quality; it describes the evidence count/state.

### Assertion type

```text
direct
derived
corroborative
contextual
```

Examples:

- PSA directly reports population -> `direct`.
- A reconciled total computed from barangay populations -> `derived`.
- A separate official article naming the same mayor -> `corroborative`.
- An unofficial election-results page used only for research -> `contextual`.

### Publication state

```text
withheld
staged
review-ready
published
superseded
retracted
```

Only records whose publication policy permits `published` may be treated as public civic facts.

## Santa Cruz identity envelope

Every production source is explicitly scoped to the same municipality identity:

```ts
type MunicipalityIdentity = {
  municipality: 'Santa Cruz'
  province: 'Laguna'
  region: 'Region IV-A'
  regionName: 'CALABARZON'
  municipalityPsgc: '0403426000'
  correspondenceCode: '043426000' | null
}
```

The validator checks the identity stored in each source record. It no longer supplies `Laguna` itself as evidence during validation.

Wrong-same-name references such as Santa Cruz in Davao del Sur, Ilocos Sur, Marinduque, Occidental Mindoro, and Zambales remain explicit regression failures. Positive identity using PSGC/province is the primary gate; the exclusion list is secondary defense.

## Civic source registry

`src/data/sources/source-registry.json` is schema version 2:

```ts
type CivicSource = {
  sourceId: string
  sourceTitle: string
  sourceUrl: string
  sourceOrganization: string
  sourceType: string
  identity: MunicipalityIdentity
  identityResolution: {
    observedLocation: string | null
    resolutionMethod:
      | 'explicit-psgc'
      | 'official-entity-id'
      | 'exact-official-name'
      | 'document-context'
      | 'manual-review'
    evidenceSourceIds: string[]
    note: string | null
  }
  categories: string[]
  authority: SourceAuthority
  access: {
    state: SourceAccessState
    checkedAt: string | null
    httpStatus: number | null
    note: string | null
  }
  reviewState: SourceReviewState
  ledgerState: SourceLedgerState
  publishedAt: string | null
  retrievedAt: string
  lastVerifiedAt: string
  archive: {
    filename: string | null
    sha256: string | null
  }
  notes: string
}
```

Production source records are Santa Cruz-only. Pagsanjan collaboration/research context is preserved separately under `docs/research/pagsanjan/` and must not be imported by the production application, source ledger, search index, or civic-data validator.

## Civic fact registry

`src/data/civic-registry.json` is also schema version 2. Facts reference source IDs instead of duplicating the complete source envelope:

```ts
type CivicFact = {
  id: string
  label: string
  value: string | number | boolean
  evidence: {
    sourceIds: string[]
    verification: FactVerificationState
    assertionType: AssertionType
    note: string | null
  }
  publication: {
    state: PublicationState
  }
  freshness: {
    lastVerifiedAt: string
    reviewCadenceDays: number | null
    validFrom: string | null
    validUntil: string | null
  }
}
```

The current published baseline retains the same civic values as before the v2 migration:

- PSGC `0403426000`;
- correspondence code `043426000`;
- 2024 POPCEN population `126844`;
- 26 barangays;
- current mayor listed by the 2026 DBM directory;
- current vice mayor listed by the 2026 DBM directory;
- exact PhilGEPS procuring-entity name.

The SB-reported barangay count remains a staged observation rather than a published fact from that source.

## Publication eligibility

`canPublishFact()` is a pure policy helper. Current general rules require:

- `publication.state === 'published'`;
- verification is not `unverified` or `disputed`;
- assertion type is not contextual;
- every source ID resolves;
- referenced sources have been reviewed;
- every referenced source resolves to Santa Cruz PSGC `0403426000`;
- a `single-source` published fact is backed by exactly one `primary-official` source;
- corroborated publication includes primary-official evidence.

High-risk future domains such as emergency contacts and service instructions may add stricter domain-specific publication policies.

## Freshness

Freshness is derived from dates rather than manually typed labels. Records can carry:

- `lastVerifiedAt`;
- review cadence;
- optional validity interval.

Helpers derive `fresh`, `review-due`, `stale`, or `expired` at runtime/review time.

## Field-level provenance

Domain records can cite different evidence for different fields:

```ts
type FieldProvenance = {
  sourceIds: string[]
  assertionType: AssertionType
  note: string | null
}
```

The current executive baseline uses DBM as direct evidence for name and role. The earlier unsourced `2025–2028` term value is withheld (`term: null`) because the DBM directory does not establish that term interval. A future term value must have its own field-level authoritative provenance.

## Canonical domain data

Officials, departments, barangays, services, legislation, procurement, projects, statistics, and contacts require explicit domain schemas plus evidence references.

A record with no eligible evidence is a staging candidate, not public canonical data.

The currently published PSA barangay baseline, DBM executive records, and population snapshot are checked by `src/lib/canonical-data.ts`. `npm run validate:data` runs these checks before production build.

Canonical checks currently include:

- exactly 26 barangay records;
- Santa Cruz PSGC-family relationships;
- barangay population reconciliation to `126844`;
- population series alignment with the canonical barangay directory;
- reviewed primary-source requirements;
- explicit source URL/retrieval parity for existing domain records;
- executive field-level provenance;
- rejection of a non-null executive term without term provenance.

## Source -> observation -> staging -> publication

Future high-volume datasets use separate layers:

```text
Civic source
  -> collection activity
  -> collection observation
  -> normalized/staged record
  -> reconciliation/review
  -> publication decision
  -> published domain record
```

Collectors must not write internet observations directly into public canonical files.

For legislation specifically, a source record and an observed legislation row are different entities. A logical legislation identity is also distinct from a content/version hash so an upstream metadata edit does not create a new legal document identity.

## Migration

`scripts/migrate-evidence-v2.ts` provides a deterministic migration/check path for legacy registries. It:

- maps legacy source/fact structures to v2;
- fails on unknown legacy statuses;
- preserves civic values;
- separates Pagsanjan research;
- supports already-migrated v2 input;
- can emit a review preview under `pipeline/`.

The committed production registry is already v2; the migration script remains as reproducible evidence of how the model transition works.
