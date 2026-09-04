import { useMemo, useState } from 'react';

import { ExternalLink, Filter, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import sourceRegistry from '@/data/sources/source-registry.json';
import { PageHero } from '@/components/layout/PageLayouts';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { SEO } from '@/components/layout/SEO';
import type { SourceRecord } from '@/lib/provenance';

type Scope = 'all' | 'Santa Cruz' | 'Pagsanjan';
type BadgeVariant = 'success' | 'warning' | 'error' | 'slate' | 'primary';

const sources = (sourceRegistry as { sources: SourceRecord[] }).sources;

const statusVariant: Record<string, BadgeVariant> = {
  verified: 'success',
  observed: 'warning',
  pending: 'warning',
  'access-restricted': 'error',
  unreachable: 'error',
  'discovery-only': 'slate',
  secondary: 'slate',
  collaboration: 'primary',
};

function formatDate(value: string | null): string {
  if (!value) return 'Not provided';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeZone: 'Asia/Manila',
  }).format(new Date(value));
}

export default function SourcesPage() {
  const [scope, setScope] = useState<Scope>('Santa Cruz');
  const [query, setQuery] = useState('');

  const filteredSources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sources.filter(source => {
      if (scope !== 'all' && source.municipality !== scope) return false;
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
  }, [query, scope]);

  return (
    <main className='bg-kapwa-bg-surface-raised min-h-screen'>
      <SEO
        title='Sources'
        description='Source registry and verification states for BetterSantaCruz research.'
        keywords={['sources', 'provenance', 'Santa Cruz Laguna', 'civic data']}
      />
      <div className='container mx-auto px-4 py-8 md:py-12'>
        <PageHero
          title='Source ledger'
          description='See where each civic lead came from, when it was checked, and why it is or is not ready for publication.'
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
                the Municipality of Santa Cruz, Laguna. A source observation is
                not automatically a verified civic fact. Read the{' '}
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
          <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <h2
                id='registry-heading'
                className='text-kapwa-text-strong kapwa-heading-lg font-bold'
              >
                Registry entries
              </h2>
              <p className='text-kapwa-text-support mt-1 text-sm'>
                {filteredSources.length} of {sources.length} source records
                shown.
              </p>
            </div>
            <div className='flex flex-col gap-3 sm:flex-row'>
              <label className='sr-only' htmlFor='source-scope'>
                Filter by municipality
              </label>
              <select
                id='source-scope'
                value={scope}
                onChange={event => setScope(event.target.value as Scope)}
                className='border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-strong min-h-11 rounded-xl border px-3 text-sm'
              >
                <option value='Santa Cruz'>Santa Cruz, Laguna</option>
                <option value='Pagsanjan'>Pagsanjan, Laguna</option>
                <option value='all'>All research context</option>
              </select>
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
                  className='border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-strong min-h-11 w-full rounded-xl border py-2 pl-10 pr-3 text-sm sm:w-56'
                />
              </label>
            </div>
          </div>

          <div className='grid gap-4'>
            {filteredSources.map(source => (
              <Card key={source.sourceId} className='border-kapwa-border-weak'>
                <CardContent className='p-5 md:p-6'>
                  <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                    <div className='min-w-0'>
                      <div className='mb-2 flex flex-wrap items-center gap-2'>
                        <Badge
                          variant={
                            statusVariant[source.verificationStatus] ?? 'slate'
                          }
                          dot
                        >
                          {source.verificationStatus}
                        </Badge>
                        <Badge variant='outline'>
                          {source.municipality}, Laguna
                        </Badge>
                      </div>
                      <h3 className='text-kapwa-text-strong text-lg font-bold leading-tight'>
                        {source.sourceTitle}
                      </h3>
                      <p className='text-kapwa-text-support mt-1 text-sm'>
                        {source.sourceOrganization} · {source.sourceType}
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
