import type { SourceRecord } from './provenance';

export interface SourceStatusSummary {
  status: SourceRecord['verificationStatus'];
  count: number;
}

const STATUS_ORDER: SourceRecord['verificationStatus'][] = [
  'verified',
  'observed',
  'pending',
  'access-restricted',
  'unreachable',
  'discovery-only',
  'secondary',
  'collaboration',
];

export function summarizeSourceStatuses(
  sources: readonly Pick<SourceRecord, 'verificationStatus'>[]
): SourceStatusSummary[] {
  const counts = new Map<SourceRecord['verificationStatus'], number>();

  for (const source of sources) {
    counts.set(
      source.verificationStatus,
      (counts.get(source.verificationStatus) ?? 0) + 1
    );
  }

  return STATUS_ORDER.flatMap(status => {
    const count = counts.get(status);
    return count ? [{ status, count }] : [];
  });
}
