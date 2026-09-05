import type { SourceRecord } from './provenance';

export interface SourceStatusSummary {
  status: SourceRecord['reviewState'];
  count: number;
}

const STATUS_ORDER: SourceRecord['reviewState'][] = [
  'reviewed',
  'needs-review',
  'unreviewed',
  'rejected',
];

export function summarizeSourceStatuses(
  sources: readonly Pick<SourceRecord, 'reviewState'>[]
): SourceStatusSummary[] {
  const counts = new Map<SourceRecord['reviewState'], number>();

  for (const source of sources) {
    counts.set(source.reviewState, (counts.get(source.reviewState) ?? 0) + 1);
  }

  return STATUS_ORDER.flatMap(status => {
    const count = counts.get(status);
    return count ? [{ status, count }] : [];
  });
}
