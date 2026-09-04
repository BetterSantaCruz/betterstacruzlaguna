import { FC } from 'react';

import { Link } from 'react-router-dom';

import { Button } from '@bettergov/kapwa/button';
import { GithubIcon, LightbulbIcon, PlusIcon } from 'lucide-react';

import { SEO } from '@/components/layout/SEO';
import { DataStatus } from '@/components/ui/DataStatus';
import { config } from '@/lib/lguConfig';

const Ideas: FC = () => {
  const issueUrl = config.portal.githubUrl
    ? `${config.portal.githubUrl}/issues/new?assignees=&labels=enhancement%2Cidea&projects=&template=idea-submission.md&title=%5BIDEA%5D+`
    : null;
  const contributeUrl = config.portal.githubUrl
    ? `${config.portal.githubUrl}/contribute`
    : null;

  return (
    <div className='bg-kapwa-bg-surface-raised min-h-screen'>
      <SEO
        title='Project Ideas'
        description='A review-gated space for future BetterSantaCruz civic technology ideas.'
        keywords={['civic tech', 'project ideas', 'community feedback']}
      />

      <div className='container mx-auto px-4 py-8 md:py-12'>
        <header className='mb-8 text-center md:mb-12'>
          <div className='mb-4 flex items-center justify-center gap-4'>
            <div className='bg-kapwa-bg-surface text-kapwa-text-brand rounded-full p-3'>
              <LightbulbIcon className='h-8 w-8' aria-hidden='true' />
            </div>
            <h1 className='text-kapwa-text-strong kapwa-heading-xl font-extrabold'>
              Project Ideas
            </h1>
          </div>
          <p className='text-kapwa-text-support mx-auto max-w-3xl text-sm md:text-lg'>
            Ideas will be published only after their scope, evidence, and
            maintenance path are clear. No inherited idea list or vote counts
            are presented here.
          </p>
        </header>

        <section className='mx-auto max-w-3xl space-y-6'>
          <DataStatus
            title='No reviewed project ideas are published yet'
            message='The BetterSantaCruz project is still establishing its source registry and public repository. Until ideas are reviewed, this page intentionally avoids presenting sample proposals, vote counts, or delivery commitments as current community priorities.'
            sourceHref='/sources'
          />

          {issueUrl || contributeUrl ? (
            <div className='flex flex-col justify-center gap-3 sm:flex-row'>
              {issueUrl && (
                <Button
                  href={issueUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  variant='primary'
                  leftIcon={<GithubIcon className='h-5 w-5' />}
                >
                  Submit an Idea
                </Button>
              )}
              {contributeUrl && (
                <Button
                  href={contributeUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  variant='outline'
                  leftIcon={<PlusIcon className='h-5 w-5' />}
                >
                  Contribute
                </Button>
              )}
            </div>
          ) : null}

          <div className='text-center'>
            <Link
              to='/about'
              className='text-kapwa-text-brand hover:text-kapwa-text-brand-bold font-semibold underline underline-offset-2'
            >
              Learn more about BetterSantaCruz
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Ideas;
