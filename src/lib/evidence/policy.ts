import type { CivicFact, CivicSource, FreshnessMetadata } from './schemas';
import type { FreshnessState } from './enums';

export function canListSource(source: CivicSource): boolean {
  return source.ledgerState === 'listed' && source.reviewState !== 'rejected';
}

export function resolveFactSources(
  fact: CivicFact,
  sources: readonly CivicSource[]
): CivicSource[] {
  const byId = new Map(sources.map(source => [source.sourceId, source]));
  return fact.evidence.sourceIds.flatMap(sourceId => {
    const source = byId.get(sourceId);
    return source ? [source] : [];
  });
}

export function canPublishFact(
  fact: CivicFact,
  sources: readonly CivicSource[]
): boolean {
  if (fact.publication.state !== 'published') return false;
  if (
    fact.evidence.verification === 'unverified' ||
    fact.evidence.verification === 'disputed' ||
    fact.evidence.assertionType === 'contextual'
  ) {
    return false;
  }

  const resolved = resolveFactSources(fact, sources);
  if (resolved.length !== fact.evidence.sourceIds.length) return false;
  if (resolved.some(source => source.reviewState !== 'reviewed')) return false;
  if (
    resolved.some(source => source.identity.municipalityPsgc !== '0403426000')
  ) {
    return false;
  }

  if (fact.evidence.verification === 'single-source') {
    return (
      resolved.length === 1 && resolved[0].authority === 'primary-official'
    );
  }

  return resolved.some(source => source.authority === 'primary-official');
}

function utcDay(value: string): number {
  return Math.floor(Date.parse(`${value}T00:00:00Z`) / 86_400_000);
}

export function getFreshnessState(
  metadata: FreshnessMetadata,
  today = new Date().toISOString().slice(0, 10)
): FreshnessState {
  if (metadata.validUntil && today > metadata.validUntil) return 'expired';
  if (!metadata.reviewCadenceDays) return 'fresh';

  const elapsed = utcDay(today) - utcDay(metadata.lastVerifiedAt);
  if (elapsed <= metadata.reviewCadenceDays) return 'fresh';
  if (elapsed <= metadata.reviewCadenceDays * 2) return 'review-due';
  return 'stale';
}
