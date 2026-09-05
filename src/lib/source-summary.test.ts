import { describe, expect, it } from 'vitest';

import { summarizeSourceStatuses } from './source-summary';

describe('summarizeSourceStatuses', () => {
  it('counts the visible evidence states in a stable review order', () => {
    expect(
      summarizeSourceStatuses([
        { verificationStatus: 'observed' },
        { verificationStatus: 'verified' },
        { verificationStatus: 'observed' },
        { verificationStatus: 'access-restricted' },
      ])
    ).toEqual([
      { status: 'verified', count: 1 },
      { status: 'observed', count: 2 },
      { status: 'access-restricted', count: 1 },
    ]);
  });

  it('does not invent a status entry for an empty result set', () => {
    expect(summarizeSourceStatuses([])).toEqual([]);
  });
});
