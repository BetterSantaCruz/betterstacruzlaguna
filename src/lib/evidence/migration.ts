import { SANTA_CRUZ_IDENTITY } from '../municipality-identity';
import type {
  AssertionType,
  FactVerificationState,
  PublicationState,
  SourceAccessState,
  SourceAuthority,
  SourceReviewState,
} from './enums';
import {
  civicRegistrySchema,
  sourceRegistrySchema,
  type CivicRegistry,
  type CivicSource,
  type SourceRegistry,
} from './schemas';

const LEGACY_STATUSES = [
  'verified',
  'observed',
  'pending',
  'access-restricted',
  'unreachable',
  'discovery-only',
  'secondary',
  'collaboration',
] as const;
type LegacyStatus = (typeof LEGACY_STATUSES)[number];

type LegacySource = {
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceOrganization: string;
  sourceType: string;
  location: string;
  publishedAt: string | null;
  retrievedAt: string;
  lastVerifiedAt: string;
  municipality: 'Santa Cruz' | 'Pagsanjan';
  categories: string[];
  confidence: string;
  verificationStatus: LegacyStatus;
  localArchiveFilename: string | null;
  notes: string;
};

type LegacyFact = {
  id: string;
  label: string;
  value: string | number | boolean;
  municipality: 'Santa Cruz' | 'Pagsanjan';
  sourceId: string;
  lastVerifiedAt: string;
  verificationStatus: LegacyStatus;
};

type LegacySourceRegistry = { sources: LegacySource[] };
type LegacyCivicRegistry = { facts: LegacyFact[] };

const AUTHORITY_OVERRIDES: Record<string, SourceAuthority> = {
  'sc-bettergov-org': 'civic-index',
  'sc-rappler-2025': 'secondary-reputable',
  'betterlgu-directory': 'community',
  'sc-santacruzkayanatin': 'unknown',
};

const ACCESS_OVERRIDES: Record<string, SourceAccessState> = {
  'sc-sb-citizens-charter': 'partially-rendered',
  'sc-sb-ordinances': 'partially-rendered',
  'sc-sb-resolutions': 'partially-rendered',
  'sc-dti-cmci': 'blocked',
  'sc-dilg-fdp': 'partially-rendered',
  'sc-coa-archive': 'reachable',
};

const REVIEW_OVERRIDES: Record<string, SourceReviewState> = {
  'sc-bettergov-org': 'reviewed',
  'betterlgu-directory': 'reviewed',
  'sc-rappler-2025': 'reviewed',
};

const IDENTITY_METHOD_OVERRIDES: Record<
  string,
  CivicSource['identityResolution']['resolutionMethod']
> = {
  'sc-psa-psgc': 'explicit-psgc',
  'sc-philgeps-11459794': 'exact-official-name',
  'sc-bettergov-org': 'exact-official-name',
  'sc-dbm': 'document-context',
  'sc-dpwh': 'document-context',
  'sc-napolcom-2026': 'document-context',
  'sc-comelec-2025': 'document-context',
};

function isLegacyStatus(value: string): value is LegacyStatus {
  return (LEGACY_STATUSES as readonly string[]).includes(value);
}

function defaultAuthority(source: LegacySource): SourceAuthority {
  if (AUTHORITY_OVERRIDES[source.sourceId]) {
    return AUTHORITY_OVERRIDES[source.sourceId];
  }
  if (
    source.sourceType.startsWith('official-') ||
    source.sourceOrganization.includes('Sangguniang Bayan')
  ) {
    return 'primary-official';
  }
  throw new Error(`No reviewed authority mapping for ${source.sourceId}`);
}

function defaultAccess(source: LegacySource): SourceAccessState {
  if (ACCESS_OVERRIDES[source.sourceId]) return ACCESS_OVERRIDES[source.sourceId];
  switch (source.verificationStatus) {
    case 'verified':
    case 'observed':
    case 'secondary':
    case 'discovery-only':
    case 'collaboration':
      return 'reachable';
    case 'access-restricted':
      return 'blocked';
    case 'unreachable':
      return 'unreachable';
    case 'pending':
      return 'not-checked';
  }
}

function defaultReview(source: LegacySource): SourceReviewState {
  if (REVIEW_OVERRIDES[source.sourceId]) return REVIEW_OVERRIDES[source.sourceId];
  switch (source.verificationStatus) {
    case 'verified':
    case 'secondary':
    case 'collaboration':
      return 'reviewed';
    case 'observed':
    case 'access-restricted':
    case 'unreachable':
    case 'discovery-only':
      return 'needs-review';
    case 'pending':
      return 'unreviewed';
  }
}

export function migrateLegacySource(source: LegacySource): CivicSource {
  if (!isLegacyStatus(source.verificationStatus)) {
    throw new Error(
      `Unknown legacy verificationStatus for ${source.sourceId}: ${String(source.verificationStatus)}`
    );
  }
  if (source.municipality !== 'Santa Cruz') {
    throw new Error(`Non-Santa Cruz source must be separated: ${source.sourceId}`);
  }

  const accessState = defaultAccess(source);
  const sbAnomaly = source.sourceId.startsWith('sc-sb-')
    ? 'The SB site retains a Lumban Logo branding anomaly; Santa Cruz identity is resolved against the reviewed PSA baseline.'
    : null;

  return {
    sourceId: source.sourceId,
    sourceTitle: source.sourceTitle,
    sourceUrl: source.sourceUrl,
    sourceOrganization: source.sourceOrganization,
    sourceType: source.sourceType,
    identity: {
      municipality: 'Santa Cruz',
      province: 'Laguna',
      region: 'Region IV-A',
      regionName: 'CALABARZON',
      municipalityPsgc: SANTA_CRUZ_IDENTITY.psgc10,
      correspondenceCode: SANTA_CRUZ_IDENTITY.correspondenceCode,
    },
    identityResolution: {
      observedLocation: source.location,
      resolutionMethod:
        IDENTITY_METHOD_OVERRIDES[source.sourceId] ?? 'manual-review',
      evidenceSourceIds:
        source.sourceId === 'sc-psa-psgc' ? [] : ['sc-psa-psgc'],
      note: sbAnomaly,
    },
    categories: source.categories,
    authority: defaultAuthority(source),
    access: {
      state: accessState,
      checkedAt: accessState === 'not-checked' ? null : source.lastVerifiedAt,
      httpStatus: null,
      note: null,
    },
    reviewState: defaultReview(source),
    ledgerState: 'listed',
    publishedAt: source.publishedAt,
    retrievedAt: source.retrievedAt,
    lastVerifiedAt: source.lastVerifiedAt,
    archive: {
      filename: source.localArchiveFilename,
      sha256: null,
    },
    notes:
      source.sourceId === 'betterlgu-directory'
        ? 'Upstream PR #244 is OPEN, records @Diannn3 as maintainer, and proposes status Work in Progress with the BetterSantaCruz repository linked. It is a directory governance record, not municipal authority. No duplicate PR is permitted.'
        : source.notes,
  };
}

export function migrateLegacySourceRegistry(value: unknown): {
  registry: SourceRegistry;
  separatedResearch: LegacySource[];
} {
  const v2 = sourceRegistrySchema.safeParse(value);
  if (v2.success) return { registry: v2.data, separatedResearch: [] };

  const legacy = value as LegacySourceRegistry;
  if (!legacy || !Array.isArray(legacy.sources)) {
    throw new Error('Legacy source registry must contain sources[]');
  }

  const separatedResearch = legacy.sources.filter(
    source => source.municipality !== 'Santa Cruz'
  );
  const migrated = legacy.sources
    .filter(source => source.municipality === 'Santa Cruz')
    .map(migrateLegacySource);

  return {
    registry: sourceRegistrySchema.parse({ schemaVersion: 2, sources: migrated }),
    separatedResearch,
  };
}

function cadenceForFact(id: string): number {
  if (id === 'sc-mayor-2025' || id === 'sc-vice-mayor-2025') return 90;
  if (id === 'sc-psa-psgc-code' || id === 'sc-psa-correspondence-code' || id === 'sc-psa-barangay-count') return 3650;
  return 365;
}

function factVerification(status: LegacyStatus): FactVerificationState {
  return status === 'verified' ? 'single-source' : 'unverified';
}

function factPublication(status: LegacyStatus): PublicationState {
  return status === 'verified' ? 'published' : 'staged';
}

export function migrateLegacyCivicRegistry(value: unknown): CivicRegistry {
  const v2 = civicRegistrySchema.safeParse(value);
  if (v2.success) return v2.data;

  const legacy = value as LegacyCivicRegistry;
  if (!legacy || !Array.isArray(legacy.facts)) {
    throw new Error('Legacy civic registry must contain facts[]');
  }

  const facts = legacy.facts.map(fact => {
    if (!isLegacyStatus(fact.verificationStatus)) {
      throw new Error(
        `Unknown legacy verificationStatus for ${fact.id}: ${String(fact.verificationStatus)}`
      );
    }
    if (fact.municipality !== 'Santa Cruz') {
      throw new Error(`Non-Santa Cruz civic fact is not permitted: ${fact.id}`);
    }
    const assertionType: AssertionType = 'direct';
    return {
      id: fact.id,
      label: fact.label,
      value: fact.value,
      evidence: {
        sourceIds: [fact.sourceId],
        verification: factVerification(fact.verificationStatus),
        assertionType,
        note: null,
      },
      publication: { state: factPublication(fact.verificationStatus) },
      freshness: {
        lastVerifiedAt: fact.lastVerifiedAt,
        reviewCadenceDays: cadenceForFact(fact.id),
        validFrom: null,
        validUntil: null,
      },
    };
  });

  return civicRegistrySchema.parse({
    schemaVersion: 2,
    municipality: {
      name: 'Santa Cruz',
      province: 'Laguna',
      psgc10: SANTA_CRUZ_IDENTITY.psgc10,
    },
    facts,
  });
}
