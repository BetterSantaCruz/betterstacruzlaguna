import { describe, expect, it } from 'vitest';

import {
  SANTA_CRUZ_IDENTITY,
  assertSantaCruzIdentity,
} from './municipality-identity';

describe('assertSantaCruzIdentity', () => {
  it('accepts the target municipality with its exact PSGC identity', () => {
    expect(() =>
      assertSantaCruzIdentity({
        municipality: 'Santa Cruz',
        province: 'Laguna',
        municipalityPsgc: SANTA_CRUZ_IDENTITY.psgc10,
        title: 'Municipality of Santa Cruz, Laguna',
      })
    ).not.toThrow();
  });

  it('rejects a Santa Cruz record with a different PSGC code', () => {
    expect(() =>
      assertSantaCruzIdentity({
        municipality: 'Santa Cruz',
        province: 'Laguna',
        municipalityPsgc: '0307113000',
      })
    ).toThrow(/0403426000/);
  });

  it('rejects a same-name record that identifies Zambales', () => {
    expect(() =>
      assertSantaCruzIdentity({
        municipality: 'Santa Cruz',
        province: 'Laguna',
        title: 'Santa Cruz Compliance Audit Report 2024 — Zambales',
      })
    ).toThrow(/wrong municipality|Zambales/i);
  });

  it('rejects a record without the Laguna parent', () => {
    expect(() =>
      assertSantaCruzIdentity({
        municipality: 'Santa Cruz',
        province: 'Davao del Sur',
      })
    ).toThrow(/Laguna/);
  });
});
