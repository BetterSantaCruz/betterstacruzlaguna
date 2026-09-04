import { FC } from 'react';

import { Link } from 'react-router-dom';

import {
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiYoutube,
} from '@icons-pack/react-simple-icons';
import { useTranslation } from 'react-i18next';

import { config } from '@/lib/lguConfig';

import { footerNavigation } from '../../data/navigation';

export const Footer: FC = () => {
  const { t } = useTranslation('common');

  const getSocialIcon = (label: string) => {
    switch (label) {
      case 'Facebook':
        return <SiFacebook className='w-5 h-5' />;
      case 'Instagram':
        return <SiInstagram className='w-5 h-5' />;
      case 'YouTube':
        return <SiYoutube className='w-5 h-5' />;
      case 'Discord':
        return <SiDiscord className='w-5 h-5' />;
      case 'GitHub':
        return <SiGithub className='w-5 h-5' />;
      default:
        return null;
    }
  };

  return (
    <footer className='bg-kapwa-bg-surface-bold selection:bg-primary-500 text-kapwa-text-inverse selection:text-kapwa-text-inverse'>
      <div className='container px-4 pt-16 pb-12 mx-auto'>
        <div className='grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
          {/* Brand Column */}
          <div className='col-span-2 space-y-6 md:col-span-3 lg:col-span-2'>
            <div className='flex items-center'>
              <img
                src={config.portal.logoWhitePath}
                alt={config.portal.name}
                className='mr-4 w-12 h-12'
              />
              <div>
                <div className='text-xl font-black tracking-tighter'>
                  {config.portal.footerBrandName}
                </div>
                <div className='text-kapwa-text-inverse text-[10px] font-bold tracking-widest uppercase'>
                  Community Civic Portal
                </div>
              </div>
            </div>
            <p className='text-kapwa-text-inverse max-w-sm text-sm leading-relaxed'>
              An independent, source-led civic information project for the
              people of {config.lgu.name}, Laguna. Local facts are published
              only after evidence review.
            </p>
            {footerNavigation.socialLinks.length > 0 && (
              <div className='flex space-x-4'>
                {footerNavigation.socialLinks.map(link => (
                  <a
                    key={link.label}
                    href={link.href}
                    className='text-kapwa-text-inverse transition-colors hover:text-kapwa-text-inverse'
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label={link.label}
                  >
                    {getSocialIcon(link.label)}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Columns */}
          {footerNavigation.mainSections.map(section => (
            <div key={section.title} className='col-span-1'>
              <h3 className='text-kapwa-text-inverse mb-6 text-[10px] font-bold tracking-[0.2em] uppercase'>
                {section.title}
              </h3>
              <ul className='space-y-4'>
                {section.links.map(link => (
                  <li key={link.label}>
                    {link.href.startsWith('http') ? (
                      <a
                        href={link.href}
                        target='_blank'
                        rel='noreferrer'
                        className='text-kapwa-text-inverse flex items-center gap-1 text-sm transition-colors hover:text-kapwa-text-link-hover'
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className='text-kapwa-text-inverse text-sm transition-colors hover:text-kapwa-text-link-hover'
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 3. Project cost statement */}
        <div className='flex justify-center mt-20'>
          <div className='inline-flex flex-col gap-2 items-center px-6 py-4 text-center rounded-full border border-kapwa-border-strong bg-kapwa-bg-surface-bold/20 md:flex-row md:gap-4'>
            <p className='text-kapwa-text-inverse text-xs font-medium md:text-sm'>
              Built by the community for the community.
            </p>
            <span className='hidden w-1 h-1 rounded-full bg-kapwa-border-strong md:block' />
            <p className='text-kapwa-text-inverse text-xs font-bold md:text-sm'>
              Project cost statement:{' '}
              <span className='text-kapwa-text-inverse'>
                Not yet documented
              </span>
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='flex flex-col gap-6 justify-between items-center pt-8 mt-16 border-t border-kapwa-border-strong md:flex-row'>
          <p className='text-kapwa-text-inverse text-[10px] font-bold tracking-widest uppercase'>
            {t('footer.copyright')}
          </p>
          <div className='flex gap-6'>
            {config.portal.githubUrl && (
              <a
                href={config.portal.githubUrl}
                target='_blank'
                rel='noreferrer'
                className='text-kapwa-text-inverse text-[10px] font-bold tracking-widest uppercase hover:text-kapwa-text-inverse'
              >
                GitHub
              </a>
            )}
            <Link
              to='/sitemap'
              className='text-kapwa-text-inverse text-[10px] font-bold tracking-widest uppercase hover:text-kapwa-text-inverse'
            >
              Sitemap
            </Link>
            {/* <Link to='/accessibility' className='text-[10px] font-bold text-kapwa-text-disabled hover:text-kapwa-text-inverse uppercase tracking-widest'>Accessibility</Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
};
