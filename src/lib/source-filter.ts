import type { SourceRecord } from './provenance';

export type SourceScope = 'all' | 'Santa Cruz';
export type SourceStatusFilter = 'all' | SourceRecord['reviewState'];
export type SourceAuthorityFilter = 'all' | SourceRecord['authority'];
export type SourceAccessFilter = 'all' | SourceRecord['access']['state'];

export interface SourceFilterOptions {
  scope?: SourceScope;
  status?: SourceStatusFilter;
  authority?: SourceAuthorityFilter;
  access?: SourceAccessFilter;
  query?: string;
}

/** Filter source-ledger records without changing their evidence states. */
export function filterSourceRecords(
  sources: readonly SourceRecord[],
  {
    scope = 'Santa Cruz',
    status = 'all',
    authority = 'all',
    access = 'all',
    query = '',
  }: SourceFilterOptions = {}
): SourceRecord[] {
  const normalizedQuery = query.trim().toLowerCase();

  return sources.filter(source => {
    if (
      scope !== 'all' &&
      source.identity.municipality !== scope
    ) {
      return false;
    }
    if (status !== 'all' && source.reviewState !== status) return false;
    if (authority !== 'all' && source.authority !== authority) return false;
    if (access !== 'all' && source.access.state !== access) return false;
    if (!normalizedQuery) return true;

    return [
      source.sourceTitle,
      source.sourceOrganization,
      source.sourceType,
      source.authority,
      source.access.state,
      source.reviewState,
      source.categories.join(' '),
      source.notes,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
}
