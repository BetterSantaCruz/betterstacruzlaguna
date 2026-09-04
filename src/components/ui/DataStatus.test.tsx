import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import { describe, expect, it } from 'vitest';

import { DataStatus } from './DataStatus';

describe('DataStatus', () => {
  it('explains when a civic dataset is still being verified', () => {
    render(
      <BrowserRouter>
        <DataStatus
          title='Data currently being verified'
          message='No department records are published yet.'
          sourceHref='/sources'
        />
      </BrowserRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Data currently being verified',
    );
    expect(screen.getByRole('link', { name: 'View source ledger' })).toHaveAttribute(
      'href',
      '/sources',
    );
  });
});
