export const SANTA_CRUZ_IDENTITY = Object.freeze({
  name: 'Santa Cruz',
  province: 'Laguna',
  region: 'Region IV-A',
  regionName: 'CALABARZON',
  psgc10: '0403426000',
  correspondenceCode: '043426000',
});

const SAME_NAME_EXCLUSIONS = [
  'davao del sur',
  'ilocos sur',
  'marinduque',
  'occidental mindoro',
  'zambales',
] as const;

type IdentityCandidate = {
  municipality: string;
  province: string;
  municipalityPsgc?: string;
  psgc10?: string;
  [key: string]: unknown;
};

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function collectStrings(value: unknown, result: string[] = []): string[] {
  if (typeof value === 'string') {
    result.push(value);
  } else if (Array.isArray(value)) {
    value.forEach(item => collectStrings(item, result));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach(item => collectStrings(item, result));
  }
  return result;
}

export function assertSantaCruzIdentity(
  value: unknown
): asserts value is IdentityCandidate {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Santa Cruz identity requires an object record');
  }

  const candidate = value as Record<string, unknown>;
  const municipality = candidate.municipality;
  const province = candidate.province;

  if (
    typeof municipality !== 'string' ||
    normalize(municipality) !== 'santa cruz'
  ) {
    throw new Error('Santa Cruz identity requires municipality Santa Cruz');
  }
  if (typeof province !== 'string' || normalize(province) !== 'laguna') {
    throw new Error('Santa Cruz identity requires province Laguna');
  }

  for (const field of ['municipalityPsgc', 'psgc10']) {
    const psgc = candidate[field];
    if (
      psgc !== undefined &&
      (typeof psgc !== 'string' || psgc !== SANTA_CRUZ_IDENTITY.psgc10)
    ) {
      throw new Error(
        `Santa Cruz identity requires municipality PSGC ${SANTA_CRUZ_IDENTITY.psgc10}`
      );
    }
  }

  const text = collectStrings(value).map(normalize).join(' | ');
  for (const excludedProvince of SAME_NAME_EXCLUSIONS) {
    if (text.includes(excludedProvince)) {
      throw new Error(
        `Santa Cruz identity references the wrong municipality or province: ${excludedProvince}`
      );
    }
  }
}

export const sameNameExclusions = [...SAME_NAME_EXCLUSIONS];
