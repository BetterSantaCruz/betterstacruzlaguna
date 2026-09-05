import { useMemo, useState } from 'react';

import { ExternalLink, Filter, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import sourceRegistry from '@/data/sources/source-registry.json';
import { PageHero } from '@/components/layout/PageLayouts';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { SEO } from '@/components/layout/SEO';
import {
  sourceAccessStates,
  sourceAuthorities,
  sourceReviewStates,
  type SourceRecord,
} from '@/lib/provenance';
import {
  filterSourceRecords,
  type SourceAccessFilter,
  type SourceAuthorityFilter,
  type SourceStatusFilter,
} from '@/lib/source-filter';
import { summarizeSourceStatuses } from '@/lib/source-summary';

type BadgeVariant = 'success' | 'warning' | 'error' | 'slate' | 'primary';

const sources = (sourceRegistry as { schemaVersion: 2; sources: SourceRecord[] })
  .sources;

const reviewVariant: Record<string, BadgeVariant> = {
  reviewed: 'success',
  'needs-review': 'warning',
  unreviewed: 'slate',
  rejected: 'error',
};

const accessVariant: Record<string, BadgeVariant> = {
  reachable: 'success',
  'partially-rendered': 'warning',
  blocked: 'error',
  'auth-redirect': 'error',
  unreachable: 'error',
  'not-checked': 'slate',
};

function formatDate(value: string | null): string {
  if (!value) return 'Not provided';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeZone: 'Asia/Manila',
  }).format(new Date(value));
}

export default function SourcesPage() {
  const [status, setStatus] = useState<SourceStatusFilter>('all');
  const [authority, setAuthority] = useState<SourceAuthorityFilter>('all');
  const [access, setAccess] = useState<SourceAccessFilter>('all');
  const [query, setQuery] = useState('');

  const filteredSources = useMemo(() => {
    return filterSourceRecords(sources, {
      scope: 'Santa Cruz',
      status,
      authority,
      access,
      query,
    });
  }, [access, authority, query, status]);

  const statusSummary = useMemo(
    () => summarizeSourceStatuses(filteredSources),
    [filteredSources]
  );

  return (
    <main className='bg-kapwa-bg-surface-raised min-h-screen'>
      <SEO
        title='Sources'
        description='Source registry and evidence-review states for BetterSantaCruz research.'
        keywords={['sources', 'provenance', 'Santa Cruz Laguna', 'civic data']}
      />
      <div className='container mx-auto px-4 py-8 md:py-12'>
        <PageHero
          title='Source ledger'
          description='See where each civic lead came from, when it was checked, who published it, and whether BetterSantaCruz has reviewed it for use.'
          breadcrumb={[
            { label: 'Home', href: '/' },
            { label: 'Sources', href: '/sources' },
          ]}
        />

        <section
          aria-label='Evidence policy'
          className='border-kapwa-border-brand bg-kapwa-bg-surface-brand/30 mx-auto mb-10 max-w-4xl rounded-2xl border p-5 md:p-6'
        >
          <div className='flex items-start gap-3'>
            <ShieldCheck
              className='text-kapwa-text-brand mt-0.5 h-6 w-6 shrink-0'
              aria-hidden='true'
            />
            <div>
              <h2 className='text-kapwa-text-strong font-bold'>
                Evidence before publication
              </h2>
              <p className='text-kapwa-text-support mt-1 text-sm leading-relaxed'>
                BetterSantaCruz is independent and not the official website of
                the Municipality of Santa Cruz, Laguna. Source authority,
                access, review state, and fact publication are separate. A
                listed source is not automatically a published civic fact. Read
                the{' '}
                <Link
                  className='text-kapwa-text-brand font-semibold underline'
                  to='/about'
                >
                  project context
                </Link>{' '}
                before using these records.
              </p>
            </div>
          </div>
        </section>

        <section
          className='mx-auto max-w-5xl'
          aria-labelledby='registry-heading'
        >
          <div className='mb-6 flex flex-col gap-4'>
            <div>
              <h2
                id='registry-heading'
                className='text-kapwa-text-strong kapwa-heading-lg font-bold'
              >
                Santa Cruz registry entries
              </h2>
              <p className='text-kapwa-text-support mt-1 text-sm'>
                {filteredSources.length} of {sources.length} production source
                records shown. Research for other municipalities is kept outside
                the public BetterSantaCruz registry.
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <label>
                <span className='sr-only'>Filter by review state</span>
                <select
                  value={status}
                  onChange={event =>
                    setStatus(event.target.value as SourceStatusFilter)
                  }
                  className='border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-strong min-h-11 w-full rounded-xl border px-3 text-sm'
                >
                  <option value='all'>All review states</option>
                  {sourceReviewStates.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className='sr-only'>Filter by source authority</span>
                <select
                  value={authority}
                  onChange={event =>
                    setAuthority(event.target.value as SourceAuthorityFilter)
                  }
                  className='border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-strong min-h-11 w-full rounded-xl border px-3 text-sm'
                >
                  <option value='all'>All authority classes</option>
                  {sourceAuthorities.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className='sr-only'>Filter by access state</span>
                <select
                  value={access}
                  onChange={event =>
                    setAccess(event.target.value as SourceAccessFilter)
                  }
                  className='border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-strong min-h-11 w-full rounded-xl border px-3 text-sm'
                >
                  <option value='all'>All access states</option>
                  {sourceAccessStates.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className='relative block'>
                <Filter
                  className='text-kapwa-text-disabled pointer-events-none absolute left-3 top-3 h-5 w-5'
                  aria-hidden='true'
                />
                <span className='sr-only'>Search sources</span>
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder='Search sources'
                  className='border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-strong min-h-11 w-full rounded-xl border py-2 pl-10 pr-3 text-sm'
                />
              </label>
            </div>
          </div>

          <section
            aria-label='Source review summary'
            className='border-kapwa-border-weak bg-kapwa-bg-surface mx-auto mb-6 flex max-w-5xl flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between'
          >
            <div>
              <h3 className='text-kapwa-text-strong text-sm font-bold'>
                Source review state
              </h3>
              <p className='text-kapwa-text-support mt-1 text-xs'>
                Counts reflect the source records currently shown.
              </p>
            </div>
            <ul className='flex flex-wrap gap-2'>
              {statusSummary.map(({ status: reviewState, count }) => (
                <li
                  key={reviewState}
                  className='border-kapwa-border-weak bg-kapwa-bg-surface-raised text-kapwa-text-support rounded-full border px-3 py-1 text-xs'
                >
                  {count} {reviewState}
                </li>
              ))}
            </ul>
          </section>

          <div className='grid gap-4'>
            {filteredSources.map(source => (
              <Card key={source.sourceId} className='border-kapwa-border-weak'>
                <CardContent className='p-5 md:p-6'>
                  <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                    <div className='min-w-0'>
                      <div className='mb-2 flex flex-wrap items-center gap-2'>
                        <Badge
                          variant={reviewVariant[source.reviewState] ?? 'slate'}
                          dot
                        >
                          {source.reviewState}
                        </Badge>
                        <Badge variant={accessVariant[source.access.state] ?? 'slate'}>
                          {source.access.state}
                        </Badge>
                        <Badge variant='outline'>{source.authority}</Badge>
                        <Badge variant='outline'>
                          {source.identity.municipality},{' '}
                          {source.identity.province}
                        </Badge>
                      </div>
                      <h3 className='text-kapwa-text-strong text-lg font-bold leading-tight'>
                        {source.sourceTitle}
                      </h3>
                      <p className='text-kapwa-text-support mt-1 text-sm'>
                        {source.sourceOrganization} · {source.sourceType}
                      </p>
                      <p className='text-kapwa-text-support mt-1 text-xs'>
                        PSGC {source.identity.municipalityPsgc} · identity via{' '}
                        {source.identityResolution.resolutionMethod}
                      </p>
                    </div>
                    <a
                      href={source.sourceUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-kapwa-text-brand inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-kapwa-border-weak px-3 text-sm font-semibold hover:bg-kapwa-bg-surface-raised'
                    >
                      Open source
                      <ExternalLink className='h-4 w-4' aria-hidden='true' />
                    </a>
                  </div>
                  <p className='text-kapwa-text-support mt-4 text-sm leading-relaxed'>
                    {source.notes}
                  </p>
                  {source.identityResolution.note && (
                    <p className='text-kapwa-text-support mt-2 text-xs leading-relaxed'>
                      Identity note: {source.identityResolution.note}
                    </p>
                  )}
                  <div className='text-kapwa-text-support mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs'>
                    <span>Retrieved {formatDate(source.retrievedAt)}</span>
                    <span>
                      Last checked {formatDate(source.lastVerifiedAt)}
                    </span>
                    <span>Published {formatDate(source.publishedAt)}</span>
                  </div>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {source.categories.map(category => (
                      <span
                        key={category}
                        className='text-kapwa-text-support rounded-full bg-kapwa-bg-surface-raised px-2 py-1 text-[11px]'
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
