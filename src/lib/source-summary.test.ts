import { describe, expect, it } from 'vitest';

import { summarizeSourceStatuses } from './source-summary';

describe('summarizeSourceStatuses', () => {
  it('counts visible source review states in a stable review order', () => {
    expect(
      summarizeSourceStatuses([
        { reviewState: 'needs-review' },
        { reviewState: 'reviewed' },
        { reviewState: 'needs-review' },
        { reviewState: 'unreviewed' },
      ])
    ).toEqual([
      { status: 'reviewed', count: 1 },
      { status: 'needs-review', count: 2 },
      { status: 'unreviewed', count: 1 },
    ]);
  });

  it('does not invent a status entry for an empty result set', () => {
    expect(summarizeSourceStatuses([])).toEqual([]);
  });
});
