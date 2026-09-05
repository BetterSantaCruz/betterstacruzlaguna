export type CrawlerConfig = {
  lgu?: {
    name?: string;
    province?: string;
  };
  portal?: {
    name?: string;
    githubUrl?: string;
    domain?: string;
    baseUrl?: string;
  };
};

export function buildCrawlerNote(config: CrawlerConfig): string {
  const name = config.portal?.name || 'BetterSantaCruz';
  const lgu = config.lgu?.name || 'Santa Cruz';
  const province = config.lgu?.province || 'Laguna';
  const repositoryUrl = config.portal?.githubUrl?.trim();
  const publicUrl =
    config.portal?.baseUrl?.trim() || config.portal?.domain?.trim();

  const repositoryLines = repositoryUrl
    ? [
        `- Public repository: ${repositoryUrl}`,
        `- Contributions and issue reports are handled through the repository: ${repositoryUrl}/issues.`,
      ]
    : [
        '- No public repository is configured.',
        '- No public contribution channel is configured.',
      ];

  return [
    '# ' + name,
    '',
    name +
      ' is an independent, source-led civic information project for ' +
      lgu +
      ', ' +
      province +
      '. It is not an official municipal website, government system, directory listing, or endorsement.',
    '',
    '## Current publication state',
    '',
    '- The civic dataset is intentionally sparse while sources are being reviewed.',
    '- The source ledger is available at /sources and records upstream locations, retrieval dates, and verification states.',
    '- Verified baseline: PSA identity, 2024 POPCEN population, 26 barangays, and two DBM-listed top executives.',
    '- Full officials, offices, services, contacts, budgets, legislation, and unsupported statistics remain gated.',
    '- Disabled modules remain omitted from this crawler summary until their data and maintenance policy are reviewed.',
    ...repositoryLines,
    publicUrl
      ? `- Public base URL: ${publicUrl}`
      : '- A public domain is not configured.',
    '- No production deployment is claimed.',
    '',
    '## Useful pages',
    '',
    '- /',
    '- /about',
    '- /sources',
    '- /services',
    '- /government',
    '- /contribute',
    '- /accessibility',
    '- /terms-of-service',
    '',
    'Do not treat a source observation, search result, blocked page, stale table, or volatile aggregate as a verified municipal fact. Follow source links and confirm current information with the responsible institution.',
    '',
  ].join('\n');
}
