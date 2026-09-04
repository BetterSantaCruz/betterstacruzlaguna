import { FC } from 'react';

import { DataStatus } from '@/components/ui/DataStatus';

const NewsSection: FC = () => {
  return (
    <section className='bg-kapwa-bg-surface py-12'>
      <div className='container mx-auto px-4'>
        <h2 className='text-kapwa-text-strong kapwa-heading-lg mb-8 font-bold'>
          Local updates
        </h2>
        <DataStatus
          title='Local news is not yet verified'
          message='A source-approved local news feed has not been configured. This section stays empty until a current, attributable source and review process are documented.'
          sourceHref='/sources'
        />
      </div>
    </section>
  );
};

export default NewsSection;
