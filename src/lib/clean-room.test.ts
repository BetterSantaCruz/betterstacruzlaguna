import { describe, expect, it } from 'vitest';

import { findInheritedClaimPaths } from './clean-room';

describe('findInheritedClaimPaths', () => {
  it('flags inherited municipality and portal claims in publishable text', () => {
    expect(
      findInheritedClaimPaths([
        {
          path: 'transparency/index.tsx',
          contents: 'Better LB is not official.',
        },
        {
          path: 'departments/[department].tsx',
          contents: 'Science and Nature City',
        },
      ])
    ).toEqual(['transparency/index.tsx', 'departments/[department].tsx']);
  });

  it('allows BetterSantaCruz wording and neutral reference terminology', () => {
    expect(
      findInheritedClaimPaths([
        {
          path: 'about/index.tsx',
          contents:
            'BetterSantaCruz is an independent community project based on reusable architecture.',
        },
      ])
    ).toEqual([]);
  });
});
