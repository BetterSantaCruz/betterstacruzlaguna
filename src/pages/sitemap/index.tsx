import { FC } from 'react';

import { Link } from 'react-router-dom';

import { BookOpenCheck, ChevronRight, Home, ShieldCheck } from 'lucide-react';

import { SEO } from '@/components/layout/SEO';
import { config } from '@/lib/lguConfig';

const sitemapSections = [
  {
    title: 'Project pages',
    icon: Home,
    links: [
      { title: 'Home', url: '/', description: 'Project overview and current scope.' },
      { title: 'About', url: '/about', description: `How ${config.portal.name} handles evidence.` },
      { title: 'Contact', url: '/contact', description: 'Published support and collaboration channels.' },
      { title: 'Accessibility', url: '/accessibility', description: 'Accessibility statement and current checks.' },
      { title: 'Terms of Service', url: '/terms-of-service', description: 'Use, source, and uncertainty guidance.' },
    ],
  },
  {
    title: 'Civic information',
    icon: BookOpenCheck,
    links: [
      { title: 'Services', url: '/services', description: 'Service directory status and reviewed records.' },
      { title: 'Government status', url: '/government', description: 'Directory status and data gaps.' },
      { title: 'Source ledger', url: '/sources', description: 'Research sources, states, and last-checked dates.' },
      { title: 'Contribute', url: '/contribute', description: 'Current contribution workflow status.' },
      { title: 'Project ideas', url: '/ideas', description: 'Review-gated future ideas.' },
      { title: 'Join us', url: '/join-us', description: 'Collaboration status.' },
    ],
  },
  {
    title: 'Evidence boundary',
    icon: ShieldCheck,
    links: [
      { title: 'Research sources', url: '/sources?scope=santa-cruz', description: 'Santa Cruz source inventory.' },
      { title: 'Pagsanjan context', url: '/sources?scope=pagsanjan', description: 'Separate ecosystem and collaboration context.' },
    ],
  },
];

const SitemapPage: FC = () => (
  <div className='bg-kapwa-bg-surface-raised min-h-screen py-12'>
    <SEO
      title='Sitemap'
      description={`Current page map for ${config.portal.name}.`}
      keywords={['sitemap', 'navigation', 'source ledger']}
    />

    <div className='container mx-auto px-4 py-8 md:py-12'>
      <div className='mx-auto max-w-5xl'>
        <header className='bg-kapwa-bg-surface mb-8 rounded-2xl border p-6 shadow-xs md:p-8'>
          <h1 className='text-kapwa-text-strong kapwa-heading-xl font-extrabold'>
            Sitemap
          </h1>
          <p className='text-kapwa-text-support mt-2 max-w-2xl'>
            A map of the pages currently published by {config.portal.name}.
            Disabled civic modules are intentionally omitted until their data
            passes review.
          </p>
        </header>

        <div className='space-y-10'>
          {sitemapSections.map(section => (
            <section key={section.title}>
              <div className='mb-4 flex items-center gap-3'>
                <div className='bg-kapwa-bg-surface text-kapwa-text-brand rounded-md p-2'>
                  <section.icon className='h-5 w-5' aria-hidden='true' />
                </div>
                <h2 className='text-kapwa-text-strong text-xl font-bold'>
                  {section.title}
                </h2>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {section.links.map(link => (
                  <Link
                    key={link.url}
                    to={link.url}
                    className='border-kapwa-border-weak bg-kapwa-bg-surface hover:bg-kapwa-bg-surface-brand group flex flex-col rounded-lg border p-4 transition-colors hover:border-kapwa-border-brand'
                  >
                    <div className='mb-2 flex items-center justify-between gap-2'>
                      <h3 className='text-kapwa-text-strong group-hover:text-kapwa-text-brand font-medium'>
                        {link.title}
                      </h3>
                      <ChevronRight
                        className='text-kapwa-text-support h-4 w-4 shrink-0'
                        aria-hidden='true'
                      />
                    </div>
                    <p className='text-kapwa-text-support text-sm'>
                      {link.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default SitemapPage;
