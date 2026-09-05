import { describe, expect, it } from 'vitest';

import { isMunicipalMayor } from './officials';

describe('isMunicipalMayor', () => {
  it('recognizes the mayor role without relying on a person slug', () => {
    expect(isMunicipalMayor('Municipal Mayor')).toBe(true);
    expect(isMunicipalMayor('Mayor')).toBe(true);
  });

  it('does not classify the vice mayor or empty roles as mayor', () => {
    expect(isMunicipalMayor('Municipal Vice Mayor')).toBe(false);
    expect(isMunicipalMayor()).toBe(false);
  });
});
