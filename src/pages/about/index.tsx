import { FC } from 'react';

import { Link } from 'react-router-dom';

import { BookOpenCheckIcon, HeartHandshakeIcon, ShieldCheckIcon } from 'lucide-react';

import { SEO } from '@/components/layout/SEO';
import { DataStatus } from '@/components/ui/DataStatus';
import { config } from '@/lib/lguConfig';

const AboutPage: FC = () => {
  const repositoryUrl = config.portal.githubUrl;

  return (
    <div className='bg-kapwa-bg-surface-raised min-h-screen'>
      <SEO
        title='About BetterSantaCruz'
        description='How BetterSantaCruz handles sources, uncertainty, and community contributions for Santa Cruz, Laguna.'
        keywords={['BetterSantaCruz', 'civic tech', 'source registry', 'Santa Cruz Laguna']}
      />

      <div className='container mx-auto px-4 py-8 md:py-12'>
        <section className='bg-kapwa-bg-surface mt-4 rounded-3xl border p-6 shadow-xs md:p-10'>
          <div className='mx-auto max-w-4xl'>
            <p className='text-kapwa-text-brand mb-3 text-xs font-bold tracking-widest uppercase'>
              Independent civic information project
            </p>
            <h1 className='text-kapwa-text-strong kapwa-heading-xl font-extrabold'>
              About BetterSantaCruz
            </h1>
            <p className='text-kapwa-text-support mt-5 max-w-3xl text-lg leading-relaxed'>
              BetterSantaCruz is a source-led community project for Santa Cruz,
              Laguna. It is designed to help people understand what has been
              found, what remains uncertain, and where to verify a claim.
            </p>

            <div className='bg-kapwa-bg-warning-weak border-kapwa-border-warning mt-8 rounded-2xl border p-5'>
              <div className='flex items-start gap-3'>
                <ShieldCheckIcon
                  className='text-kapwa-text-warning mt-0.5 h-6 w-6 shrink-0'
                  aria-hidden='true'
                />
                <p className='text-kapwa-text-warning text-sm leading-relaxed'>
                  This is not an official Municipality of Santa Cruz website,
                  government system, directory listing, or endorsement. A source
                  observation is not automatically a verified municipal fact.
                </p>
              </div>
            </div>

            <div className='mt-10 grid gap-5 md:grid-cols-3'>
              <article className='border-kapwa-border-weak bg-kapwa-bg-surface-raised rounded-2xl border p-5'>
                <BookOpenCheckIcon
                  className='text-kapwa-text-brand mb-4 h-7 w-7'
                  aria-hidden='true'
                />
                <h2 className='text-kapwa-text-strong mb-2 text-lg font-bold'>
                  Source first
                </h2>
                <p className='text-kapwa-text-support text-sm leading-relaxed'>
                  Each published civic fact is expected to point to a source
                  record, retrieval date, and verification state.
                </p>
              </article>
              <article className='border-kapwa-border-weak bg-kapwa-bg-surface-raised rounded-2xl border p-5'>
                <ShieldCheckIcon
                  className='text-kapwa-text-brand mb-4 h-7 w-7'
                  aria-hidden='true'
                />
                <h2 className='text-kapwa-text-strong mb-2 text-lg font-bold'>
                  Uncertainty stays visible
                </h2>
                <p className='text-kapwa-text-support text-sm leading-relaxed'>
                  Restricted, unreachable, stale, or conflicting sources stay
                  labelled instead of being presented as settled data.
                </p>
              </article>
              <article className='border-kapwa-border-weak bg-kapwa-bg-surface-raised rounded-2xl border p-5'>
                <HeartHandshakeIcon
                  className='text-kapwa-text-brand mb-4 h-7 w-7'
                  aria-hidden='true'
                />
                <h2 className='text-kapwa-text-strong mb-2 text-lg font-bold'>
                  Review before publication
                </h2>
                <p className='text-kapwa-text-support text-sm leading-relaxed'>
                  Contributions and datasets need an evidence trail and a
                  maintenance path before they become public records.
                </p>
              </article>
            </div>

            <div className='mt-10'>
              <DataStatus
                title='The Santa Cruz dataset is still being established'
                message='Officials, offices, services, schedules, fees, contacts, budgets, statistics, and barangay records remain unpublished until they pass the project’s source and verification checks.'
                sourceHref='/sources'
              />
            </div>

            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <Link
                to='/sources'
                className='bg-kapwa-bg-brand-default text-kapwa-text-inverse hover:bg-kapwa-bg-brand-hover inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-colors'
              >
                Browse the source ledger
              </Link>
              {repositoryUrl ? (
                <a
                  href={`${repositoryUrl}/contribute`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-support hover:bg-kapwa-bg-surface-raised inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-3 text-sm font-bold transition-colors'
                >
                  Contribute via repository
                </a>
              ) : (
                <Link
                  to='/contribute'
                  className='border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-support hover:bg-kapwa-bg-surface-raised inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-3 text-sm font-bold transition-colors'
                >
                  View contribution status
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
