import { FC } from 'react';

import { Link } from 'react-router-dom';

import { UsersIcon } from 'lucide-react';

import { SEO } from '@/components/layout/SEO';
import { DataStatus } from '@/components/ui/DataStatus';
import { config } from '@/lib/lguConfig';

const JoinUs: FC = () => {
  const repositoryUrl = config.portal.githubUrl;
  const discordUrl = config.portal.discordUrl;

  return (
    <div className='bg-kapwa-bg-surface-raised min-h-screen'>
      <SEO
        title='Join BetterSantaCruz'
        description='Contribution and collaboration status for the independent BetterSantaCruz civic information project.'
      />

      <section className='from-kapwa-brand-700 via-kapwa-brand-800 to-kapwa-purple-800 bg-linear-to-br text-white'>
        <div className='container mx-auto px-4 py-16 md:py-24'>
          <div className='mx-auto max-w-3xl text-center'>
            <div className='bg-kapwa-bg-surface/15 mb-6 inline-flex rounded-full p-4'>
              <UsersIcon className='text-kapwa-text-inverse h-10 w-10' aria-hidden='true' />
            </div>
            <h1 className='text-kapwa-text-inverse kapwa-heading-xl font-extrabold'>
              Join BetterSantaCruz
            </h1>
            <p className='text-kapwa-text-inverse/85 mt-5 text-lg leading-relaxed'>
              Help build a careful, source-led civic information project for
              Santa Cruz, Laguna. Contributions should improve evidence quality,
              accessibility, or the maintainability of the public repository.
            </p>
          </div>
        </div>
      </section>

      <div className='container mx-auto px-4 py-10 md:py-14'>
        <div className='mx-auto max-w-3xl space-y-6'>
          <DataStatus
            title='Public contribution channels are not published yet'
            message='The repository and community invite are still being prepared. No volunteer form, Discord redirect, or issue submission is presented until a verified public channel is configured.'
            sourceHref='/sources'
          />

          {repositoryUrl || discordUrl ? (
            <div className='flex flex-col justify-center gap-3 sm:flex-row'>
              {repositoryUrl && (
                <a
                  href={`${repositoryUrl}/contribute`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='bg-kapwa-bg-brand-default text-kapwa-text-inverse hover:bg-kapwa-bg-brand-hover inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition-colors'
                >
                  Open repository contribution guide
                </a>
              )}
              {discordUrl && (
                <a
                  href={discordUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='border-kapwa-border-weak bg-kapwa-bg-surface text-kapwa-text-support hover:bg-kapwa-bg-surface-raised inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-3 text-sm font-bold transition-colors'
                >
                  Join the community
                </a>
              )}
            </div>
          ) : null}

          <div className='text-center'>
            <Link
              to='/about'
              className='text-kapwa-text-brand hover:text-kapwa-text-brand-bold font-semibold underline underline-offset-2'
            >
              Read how the project handles evidence
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinUs;
