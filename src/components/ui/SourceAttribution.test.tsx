import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { SourceAttribution } from './SourceAttribution';

describe('SourceAttribution', () => {
  it('shows the source identity, status, and freshness dates', () => {
    render(
      <SourceAttribution
        source={{
          sourceId: 'sc-psa-psgc',
          sourceTitle: 'Municipality of Santa Cruz — PSA PSGC',
          sourceUrl: 'https://psa.gov.ph/example',
          sourceOrganization: 'Philippine Statistics Authority',
          retrievedAt: '2026-09-05',
          lastVerifiedAt: '2026-09-05',
          verificationStatus: 'verified',
        }}
      />
    );

    expect(
      screen.getByRole('note', { name: 'Source attribution' })
    ).toHaveTextContent('verified');
    expect(
      screen.getByRole('link', {
        name: 'Municipality of Santa Cruz — PSA PSGC',
      })
    ).toHaveAttribute('href', 'https://psa.gov.ph/example');
    expect(screen.getByText(/Source ID: sc-psa-psgc/)).toBeInTheDocument();
    expect(
      screen.getByText(/Last checked September 5, 2026/)
    ).toBeInTheDocument();
  });
});
