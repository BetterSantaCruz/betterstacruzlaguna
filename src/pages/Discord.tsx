import { useEffect } from 'react';

import { config } from '@/lib/lguConfig';
import { DataStatus } from '@/components/ui/DataStatus';

export default function Discord() {
  const discordUrl = config.portal.discordUrl;

  useEffect(() => {
    if (discordUrl) window.location.assign(discordUrl);
  }, [discordUrl]);

  if (!discordUrl) {
    return (
      <main className='mx-auto min-h-screen max-w-3xl px-4 py-12'>
        <DataStatus
          title='Community invite not published yet'
          message={`${config.portal.name} does not have a verified public Discord invite configured. No redirect was attempted.`}
          sourceHref='/sources'
        />
      </main>
    );
  }

  return <h1>Redirecting to {config.portal.name} Discord invite...</h1>;
}
