import { config } from '../lib/lguConfig';
import { NavigationItem } from '../types';
import serviceCategories from './service_categories.json';

interface Category {
  name: string;
  slug: string;
}

const conditionalNavigation: NavigationItem[] = [
  ...(config.features.statistics
    ? [
        {
          label: 'Statistics',
          href: '/statistics',
          children: [
            { label: 'Demographics', href: '/statistics' },
            { label: 'Competitiveness', href: '/statistics/competitiveness' },
            { label: 'Municipal Income', href: '/statistics/municipal-income' },
          ],
        },
      ]
    : []),
  ...(config.features.openLGU
    ? [
        {
          label: 'OpenLGU',
          href: '/openlgu',
          children: [
            { label: 'Ordinances', href: '/openlgu?type=ordinance' },
            { label: 'Resolutions', href: '/openlgu?type=resolution' },
            { label: 'Executive Orders', href: '/openlgu?type=executive_order' },
          ],
        },
      ]
    : []),
  ...(config.features.transparency
    ? [
        {
          label: 'Transparency',
          href: '/transparency',
          children: [
            { label: 'Financial Reports', href: '/transparency/financial' },
            { label: 'Procurement', href: '/transparency/procurement' },
            { label: 'Projects', href: '/transparency/infrastructure' },
          ],
        },
      ]
    : []),
];

export const mainNavigation: NavigationItem[] = [
  {
    label: 'Services',
    href: '/services',
    children: (serviceCategories.categories as Category[]).map(category => ({
      label: category.name,
      href: `/services?category=${category.slug}`,
    })),
  },
  {
    label: 'Government',
    href: '/government',
    children: [
      { label: 'Elected Officials', href: '/government/elected-officials' },
      { label: 'Departments', href: '/government/departments' },
      { label: 'Barangays', href: '/government/barangays' },
    ],
  },
  {
    label: 'Sources',
    href: '/sources',
  },
  ...conditionalNavigation,
];

export const footerNavigation = {
  brand: {
    title: config.portal.name,
    description: `Independent, source-led civic information for ${config.lgu.name}, Laguna. Local facts are published only after evidence review.`,
    cost: 'Project funding: not documented',
  },

  mainSections: [
    {
      title: 'Explore',
      links: [
        { label: 'Services', href: '/services' },
        { label: 'Government status', href: '/government' },
        { label: 'Source ledger', href: '/sources' },
        { label: 'About', href: '/about' },
        { label: 'Contribute', href: '/contribute' },
      ],
    },
    {
      title: 'Related public resources',
      links: [
        {
          label: 'BetterLGU Directory (source)',
          href: 'https://github.com/jmacj/better-lgu-directory',
          target: '_blank',
        },
        {
          label: 'BetterGov index (source)',
          href: 'https://transparency.bettergov.ph',
          target: '_blank',
        },
      ],
    },
    {
      title: 'Primary sources',
      links: [
        {
          label: 'PhilGEPS',
          href: 'https://notices.philgeps.gov.ph/',
          target: '_blank',
        },
        {
          label: 'Philippine Statistics Authority',
          href: 'https://psa.gov.ph/classification/psgc',
          target: '_blank',
        },
        {
          label: 'DILG Full Disclosure',
          href: 'https://fdpp.dilg.gov.ph/fdpp/report/index',
          target: '_blank',
        },
        {
          label: 'Freedom of Information',
          href: 'https://www.foi.gov.ph',
          target: '_blank',
        },
      ],
    },
  ],
  socialLinks: [] as Array<{ label: string; href: string; target: string }>,
};
