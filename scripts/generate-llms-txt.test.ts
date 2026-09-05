import { describe, expect, it } from 'vitest';

import { buildCrawlerNote } from './llms-content';

describe('buildCrawlerNote', () => {
  it('publishes a configured repository without implying a domain or deployment', () => {
    const output = buildCrawlerNote({
      portal: {
        name: 'BetterSantaCruz',
        githubUrl: 'https://github.com/Diannn3/betterstacruzlaguna',
        domain: '',
        baseUrl: '',
      },
      lgu: { name: 'Santa Cruz', province: 'Laguna' },
    });

    expect(output).toContain(
      '- Public repository: https://github.com/Diannn3/betterstacruzlaguna'
    );
    expect(output).toContain('- A public domain is not configured.');
    expect(output).toContain('- No production deployment is claimed.');
    expect(output).not.toContain('not established by this local foundation');
  });

  it('keeps repository publication claims absent when no repository is configured', () => {
    const output = buildCrawlerNote({
      portal: { name: 'BetterSantaCruz', githubUrl: '' },
      lgu: { name: 'Santa Cruz', province: 'Laguna' },
    });

    expect(output).toContain('- No public repository is configured.');
    expect(output).not.toContain('- Public repository:');
  });

  it('describes the verified baseline without implying a complete civic dataset', () => {
    const output = buildCrawlerNote({
      portal: { name: 'BetterSantaCruz' },
      lgu: { name: 'Santa Cruz', province: 'Laguna' },
    });

    expect(output).toContain(
      '- Verified baseline: PSA identity, 2024 POPCEN population, 26 barangays, and two DBM-listed top executives.'
    );
    expect(output).toContain(
      '- Full officials, offices, services, contacts, budgets, legislation, and unsupported statistics remain gated.'
    );
    expect(output).not.toContain(
      'statistics, and barangay records are not published'
    );
  });
});
