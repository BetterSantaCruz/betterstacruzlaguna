import type { SourceRecord } from './provenance';

export type SourceScope = 'all' | SourceRecord['municipality'];
export type SourceStatusFilter = 'all' | SourceRecord['verificationStatus'];

export interface SourceFilterOptions {
  scope?: SourceScope;
  status?: SourceStatusFilter;
  query?: string;
}

/** Filter source-ledger records without changing their evidence states. */
export function filterSourceRecords(
  sources: readonly SourceRecord[],
  { scope = 'all', status = 'all', query = '' }: SourceFilterOptions = {}
): SourceRecord[] {
  const normalizedQuery = query.trim().toLowerCase();

  return sources.filter(source => {
    if (scope !== 'all' && source.municipality !== scope) return false;
    if (status !== 'all' && source.verificationStatus !== status) return false;
    if (!normalizedQuery) return true;

    return [
      source.sourceTitle,
      source.sourceOrganization,
      source.sourceType,
      source.verificationStatus,
      source.categories.join(' '),
      source.notes,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
}
