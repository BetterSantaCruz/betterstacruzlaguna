import { FC, useState } from 'react';

import { Link } from 'react-router-dom';

import { Button } from '@bettergov/kapwa/button';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeIcon,
  HeartHandshakeIcon,
  MailIcon,
  MessageCircleIcon,
  UsersIcon,
} from 'lucide-react';

import { config } from '@/lib/lguConfig';
import { SEO } from '@/components/layout/SEO';
import { DataStatus } from '@/components/ui/DataStatus';

const ContactUs: FC = () => {
  const contactMethods = [
    ...(config.portal.contactEmail
      ? [
          {
            icon: <MailIcon className='h-8 w-8' />,
            title: 'Email Us',
            description:
              'Send us an email for general inquiries and collaboration opportunities',
            contact: config.portal.contactEmail,
            action: `mailto:${config.portal.contactEmail}`,
            color: 'bg-kapwa-bg-brand-weak text-kapwa-text-brand',
          },
        ]
      : []),
    ...(config.portal.discordUrl
      ? [
          {
            icon: <MessageCircleIcon className='h-8 w-8' />,
            title: 'Discord Community',
            description:
              'Join our volunteer community for real-time discussions and support',
            contact: 'Discord',
            action: config.portal.discordUrl,
            color: 'bg-kapwa-bg-brand-weak text-kapwa-text-brand',
          },
        ]
      : []),
    {
      icon: <UsersIcon className='h-8 w-8' />,
      title: 'Volunteer With Us',
      description: 'Help us build better digital services for Filipinos',
      contact: 'Become a Volunteer',
      action: '/join-us',
      color: 'bg-kapwa-bg-brand-weak text-kapwa-text-brand',
    },
    ...(config.portal.githubUrl
      ? [
          {
            icon: <GlobeIcon className='h-8 w-8' />,
            title: 'Report Issues',
            description:
              'Found a bug or have a suggestion? Open an issue on GitHub',
            contact: 'GitHub Issues',
            action: `${config.portal.githubUrl}/issues`,
            color: 'bg-kapwa-bg-brand-weak text-kapwa-text-brand',
          },
        ]
      : []),
  ];

  const faqs = [
    {
      question: 'How can I volunteer for BetterSantaCruz?',
      answer:
        'We welcome volunteers with various skills! Check out our Join Us page to see current opportunities and fill out our volunteer form.',
      link: { text: 'Join Us page', href: '/join-us' },
    },
    {
      question: 'Is BetterSantaCruz affiliated with the Philippine government?',
      answer:
        'No. BetterSantaCruz is an independent community project and is not an official government portal or government system.',
    },
    {
      question: 'How do I report a bug or request a feature?',
      answer: config.portal.githubUrl
        ? 'The best way is to open an issue on our GitHub repository. This helps us track and prioritize all requests.'
        : 'The public repository and issue tracker have not been published yet. Use the source ledger to review current evidence and check back when a contribution channel is available.',
      ...(config.portal.githubUrl
        ? {
            link: {
              text: 'GitHub repository',
              href: `${config.portal.githubUrl}/issues`,
            },
          }
        : {}),
    },
    {
      question: 'Can I use BetterSantaCruz content for my project?',
      answer:
        'Check the repository license and the terms attached to each source before reusing material. Source documents remain subject to their own terms.',
    },
    {
      question: 'Where does the data on BetterSantaCruz come from?',
      answer:
        'Published facts are intended to point back to a source record with retrieval and verification state. Unverified or unavailable material stays out of the civic dataset.',
    },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className='bg-kapwa-bg-surface-raised min-h-screen'>
      <SEO
        title='Contact Us'
        description='Get in touch with our volunteers, report issues, or join our community.'
        keywords={['contact', 'volunteer', 'feedback', 'support']}
      />

      <div className='container mx-auto px-4 py-8 md:py-12'>
        {/* Header Section */}
        <div className='bg-kapwa-bg-surface border-kapwa-border-weak mt-4 rounded-lg border p-6 shadow-xs md:p-8 md:py-16'>
          <div className='mx-auto max-w-4xl text-center'>
            <div className='mb-6 flex justify-center'>
              <div className='bg-kapwa-bg-info-weak rounded-full p-4'>
                <HeartHandshakeIcon className='text-kapwa-text-info h-12 w-12' />
              </div>
            </div>
            <h1 className='text-kapwa-text-strong kapwa-heading-xl font-extrabold'>
              Connect with Us
            </h1>
            <p className='text-kapwa-text-support mx-auto mb-8 max-w-3xl text-lg md:text-xl'>
              We&apos;re a passionate community of volunteers, developers, and
              designers dedicated to improving digital public services in the
              Philippines. Whether you have a question, a suggestion, or want to
              join our mission, we&apos;d love to hear from you.
            </p>
          </div>
        </div>

        {/* Contact Methods Grid */}
        {!config.portal.contactEmail &&
          !config.portal.discordUrl &&
          !config.portal.githubUrl && (
            <div className='mt-8'>
              <DataStatus
                title='Dedicated contact channels are not published yet'
                message='The project currently has no verified public email, Discord invite, or issue tracker. You can review the source ledger while the contribution and support channels are prepared.'
                sourceHref='/sources'
              />
            </div>
          )}
        <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {contactMethods.map((method, index) => (
            <div
              key={index}
              className='bg-kapwa-bg-surface border-kapwa-border-weak rounded-lg border p-6 shadow-xs transition-shadow hover:shadow-md'
            >
              <div className={`${method.color} mb-4 w-fit rounded-lg p-3`}>
                {method.icon}
              </div>
              <h3 className='text-kapwa-text-strong mb-2 text-lg font-semibold'>
                {method.title}
              </h3>
              <p className='text-kapwa-text-support mb-4 text-sm'>
                {method.description}
              </p>
              <Button
                href={method.action}
                variant='link'
                size='sm'
                rightIcon={<ArrowRightIcon className='h-4 w-4' />}
                target={method.action.startsWith('http') ? '_blank' : undefined}
                rel={
                  method.action.startsWith('http')
                    ? 'noopener noreferrer'
                    : undefined
                }
              >
                {method.contact}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className='bg-kapwa-bg-surface mt-8 rounded-lg border p-6 shadow-xs md:p-8'>
          <div className='mx-auto max-w-4xl'>
            <div className='mb-8 text-center'>
              <h2 className='text-kapwa-text-strong mb-4 kapwa-heading-lg font-bold'>
                Frequently Asked Questions
              </h2>
              <p className='text-kapwa-text-support'>
                Find answers to common questions about BetterSantaCruz
              </p>
            </div>

            <div className='space-y-4'>
              {faqs.map((faq, index) => (
                <div key={index} className='rounded-lg border'>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className='flex w-full items-center justify-between p-4 text-left'
                  >
                    <h3 className='text-kapwa-text-support flex-1 font-semibold'>
                      {faq.question}
                    </h3>
                    {openFaq === index ? (
                      <ChevronUpIcon className='text-kapwa-text-disabled h-5 w-5' />
                    ) : (
                      <ChevronDownIcon className='text-kapwa-text-disabled h-5 w-5' />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className='text-kapwa-text-support p-4 pt-0 text-sm leading-relaxed'>
                      <p>
                        {faq.answer}
                        {faq.link && (
                          <>
                            {' '}
                            <Link
                              to={faq.link.href}
                              className='text-kapwa-text-info font-medium hover:text-kapwa-text-link-hover'
                              target={
                                faq.link.href.startsWith('http')
                                  ? '_blank'
                                  : '_self'
                              }
                              rel={
                                faq.link.href.startsWith('http')
                                  ? 'noopener noreferrer'
                                  : undefined
                              }
                            >
                              {faq.link.text}
                            </Link>
                            .
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className='from-kapwa-brand-600 to-kapwa-purple-600 bg-linear-to-r mt-8 rounded-lg p-8 text-center'>
          <h3 className='text-kapwa-text-inverse mb-4 kapwa-heading-md font-bold'>
            Ready to Make a Difference?
          </h3>
          <p className='text-kapwa-text-inverse/80 mx-auto mb-6 max-w-2xl'>
            Join our community of volunteers building better digital services
            for the Philippines.
          </p>
          <Link
            to='/join-us'
            className='bg-kapwa-bg-surface text-kapwa-text-info hover:bg-kapwa-bg-surface-raised inline-flex items-center rounded-lg px-6 py-3 font-semibold transition-colors'
          >
            Become a Volunteer
            <ArrowRightIcon className='ml-2 h-5 w-5' />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
