import crypto from 'node:crypto';

import type {
  AnomalyCode,
  AnomalySeverity,
  CollectionObservation,
  StagedLegislation,
} from './schemas';

export const COLLECTOR_VERSION = 'sbstacruz-legislation-v1';

export type RawLegislationPayload = {
  sourceNativeId?: unknown;
  detailUrl?: unknown;
  numberLabel?: unknown;
  title?: unknown;
  approvedDate?: unknown;
  authors?: unknown;
  coAuthors?: unknown;
  tags?: unknown;
  actionText?: unknown;
  documentUrl?: unknown;
  [key: string]: unknown;
};

export type DocumentType = 'ordinance' | 'resolution';

export type ParsedNumberLabel = {
  rawNumberLabel: string;
  parsedNumber: string | null;
  seriesCode: string | null;
  seriesYear: number | null;
};

export type StagingAnomaly = {
  code: AnomalyCode;
  severity: AnomalySeverity;
  note: string | null;
};

const FILIPINO_LEGAL_PREFIX = /\b(kapasiyahan|kautusang\s+bayan|blg\.)\b/i;
const ENGLISH_LEGAL_PREFIX = /\b(resolution|municipal\s+ordinance|ordinance|no\.)\b/i;
const COLLECTIVE_AUTHOR = /\b(sangguniang\s+bayan|all\s+sb\s+members)\b/i;

export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTitle(value: unknown): string {
  return normalizeText(value);
}

export function normalizeTag(value: unknown): string {
  return normalizeText(value).toLocaleLowerCase('en-PH');
}

export function parseNumberLabel(value: unknown): ParsedNumberLabel {
  const rawNumberLabel = normalizeText(value);
  if (!rawNumberLabel) {
    return {
      rawNumberLabel,
      parsedNumber: null,
      seriesCode: null,
      seriesYear: null,
    };
  }

  const match = rawNumberLabel.match(
    /(?:\b(?:no\.?|number|blg\.?)\s*)?(\d{1,6})\s*-\s*([a-z])\s*['’]?\s*(\d{4})\b/i
  );

  if (!match) {
    return {
      rawNumberLabel,
      parsedNumber: null,
      seriesCode: null,
      seriesYear: null,
    };
  }

  return {
    rawNumberLabel,
    parsedNumber: match[1],
    seriesCode: match[2].toUpperCase(),
    seriesYear: Number.parseInt(match[3], 10),
  };
}

export function languageHintFor(
  rawNumberLabel: unknown,
  title: unknown
): 'en' | 'fil' | 'mixed' | 'unknown' {
  const text = `${normalizeText(rawNumberLabel)} ${normalizeText(title)}`;
  const hasFilipino = FILIPINO_LEGAL_PREFIX.test(text);
  const hasEnglish = ENGLISH_LEGAL_PREFIX.test(text);

  if (hasFilipino && hasEnglish) return 'mixed';
  if (hasFilipino) return 'fil';
  if (hasEnglish) return 'en';
  return 'unknown';
}

function splitListLike(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean);
  }

  const text = normalizeText(value);
  if (!text) return [];

  // Semicolons and line breaks are safer delimiters than commas because legal
  // names can contain suffixes. Preserve comma-bearing strings as one name.
  return text
    .split(/\s*;\s*|\s*\n\s*/)
    .map(normalizeText)
    .filter(Boolean);
}

export function normalizeNames(value: unknown) {
  return splitListLike(value).map(rawName => ({
    rawName,
    normalizedCandidate: null,
  }));
}

export function normalizeTags(value: unknown) {
  const raw = splitListLike(value);
  return {
    tagsRaw: raw,
    tagsNormalized: raw.map(normalizeTag),
  };
}

function safeUrl(value: unknown): string | null {
  const text = normalizeText(value);
  if (!text) return null;
  try {
    const url = new URL(text, 'https://www.sbstacruz.com');
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function classifyDocumentState(
  actionText: unknown,
  documentUrl: unknown
): {
  state: 'pdf-available' | 'request-copy' | 'metadata-only' | 'unavailable';
  url: string | null;
} {
  const action = normalizeText(actionText);
  const url = safeUrl(documentUrl);

  if (/request\s+(?:a\s+)?copy/i.test(action)) {
    return { state: 'request-copy', url };
  }

  if (url && /\.pdf(?:$|[?#])/i.test(url)) {
    return { state: 'pdf-available', url };
  }

  if (url) {
    return { state: 'metadata-only', url };
  }

  return { state: 'metadata-only', url: null };
}

export function parseExplicitDate(value: unknown): string | null {
  const text = normalizeText(value);
  if (!text) return null;

  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const candidate = `${iso[1]}-${iso[2]}-${iso[3]}`;
    const time = Date.parse(`${candidate}T00:00:00Z`);
    return Number.isNaN(time) ? null : candidate;
  }

  const slash = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slash) {
    const month = slash[1].padStart(2, '0');
    const day = slash[2].padStart(2, '0');
    const candidate = `${slash[3]}-${month}-${day}`;
    const time = Date.parse(`${candidate}T00:00:00Z`);
    return Number.isNaN(time) ? null : candidate;
  }

  const monthNames: Record<string, string> = {
    january: '01',
    february: '02',
    march: '03',
    april: '04',
    may: '05',
    june: '06',
    july: '07',
    august: '08',
    september: '09',
    october: '10',
    november: '11',
    december: '12',
  };
  const monthName = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i
  );
  if (monthName) {
    const month = monthNames[monthName[1].toLowerCase()];
    const day = monthName[2].padStart(2, '0');
    const candidate = `${monthName[3]}-${month}-${day}`;
    const time = Date.parse(`${candidate}T00:00:00Z`);
    return Number.isNaN(time) ? null : candidate;
  }

  return null;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableJson(object[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function contentHash(value: unknown): `sha256:${string}` {
  return `sha256:${crypto.createHash('sha256').update(stableJson(value)).digest('hex')}`;
}

export function logicalRecordKey(input: {
  documentType: DocumentType;
  sourceNativeId?: unknown;
  detailUrl?: unknown;
  documentUrl?: unknown;
  parsedNumber?: string | null;
  seriesCode?: string | null;
  seriesYear?: number | null;
}): string {
  const nativeId = normalizeText(input.sourceNativeId);
  if (nativeId) return `native:${nativeId}`;

  const detailUrl = safeUrl(input.detailUrl);
  if (detailUrl) return `detail:${detailUrl}`;

  const documentUrl = safeUrl(input.documentUrl);
  if (documentUrl) return `document:${documentUrl}`;

  if (
    input.parsedNumber &&
    input.seriesCode &&
    Number.isInteger(input.seriesYear)
  ) {
    return [
      input.documentType,
      input.seriesYear,
      input.seriesCode,
      input.parsedNumber,
    ].join('|');
  }

  return `fingerprint:${contentHash({
    documentType: input.documentType,
    parsedNumber: input.parsedNumber ?? null,
    seriesCode: input.seriesCode ?? null,
    seriesYear: input.seriesYear ?? null,
  }).slice('sha256:'.length, 'sha256:'.length + 24)}`;
}

function anomalySeverity(code: AnomalyCode): AnomalySeverity {
  if (
    ['source_identity_mismatch', 'duplicate_logical_key', 'empty_record'].includes(
      code
    )
  ) {
    return 'blocking';
  }
  if (
    [
      'missing_number',
      'missing_title',
      'missing_series_year',
      'unknown_series_code',
      'future_document_date',
      'date_series_year_mismatch',
      'possible_language_variant_duplicate',
      'author_parse_ambiguous',
      'collective_author_unresolved',
      'author_coauthor_duplicate',
      'document_link_broken',
      'unexpected_document_link',
      'pagination_gap',
      'unexpected_response_shape',
    ].includes(code)
  ) {
    return 'review';
  }
  return 'info';
}

function anomaly(code: AnomalyCode, note: string | null = null): StagingAnomaly {
  return {
    code,
    severity: anomalySeverity(code),
    note,
  };
}

function detectAnomalies(input: {
  parsed: ParsedNumberLabel;
  titleRaw: string;
  dateEnacted: string | null;
  authors: Array<{ rawName: string }>;
  coAuthors: Array<{ rawName: string }>;
  document: { state: string; url: string | null };
  collectedAt: string;
}): StagingAnomaly[] {
  const anomalies: StagingAnomaly[] = [];
  if (!input.parsed.parsedNumber) anomalies.push(anomaly('missing_number'));
  if (!input.titleRaw) anomalies.push(anomaly('missing_title'));
  if (!input.parsed.seriesYear) anomalies.push(anomaly('missing_series_year'));
  if (input.parsed.seriesCode && !/^[A-Z]$/.test(input.parsed.seriesCode)) {
    anomalies.push(
      anomaly('unknown_series_code', `Observed code: ${input.parsed.seriesCode}`)
    );
  }

  if (input.dateEnacted) {
    const collectedDay = input.collectedAt.slice(0, 10);
    if (input.dateEnacted > collectedDay) {
      anomalies.push(
        anomaly('future_document_date', `Observed date: ${input.dateEnacted}`)
      );
    }
    if (
      input.parsed.seriesYear &&
      Number.parseInt(input.dateEnacted.slice(0, 4), 10) !==
        input.parsed.seriesYear
    ) {
      anomalies.push(
        anomaly(
          'date_series_year_mismatch',
          `Series ${input.parsed.seriesYear}; observed date ${input.dateEnacted}`
        )
      );
    }
  }

  const authorNames = new Set(
    input.authors.map(item => normalizeText(item.rawName).toLowerCase())
  );
  const duplicateAcrossRoles = input.coAuthors.some(item =>
    authorNames.has(normalizeText(item.rawName).toLowerCase())
  );
  if (duplicateAcrossRoles) anomalies.push(anomaly('author_coauthor_duplicate'));

  if (
    input.authors.some(item => COLLECTIVE_AUTHOR.test(item.rawName)) ||
    input.coAuthors.some(item => COLLECTIVE_AUTHOR.test(item.rawName))
  ) {
    anomalies.push(anomaly('collective_author_unresolved'));
  }

  if (input.document.state === 'request-copy' && !input.document.url) {
    anomalies.push(anomaly('request_copy_no_public_file'));
  }

  return anomalies;
}

export function toCollectionObservation(input: {
  documentType: DocumentType;
  sourceId: 'sc-sb-ordinances' | 'sc-sb-resolutions';
  sourceKey: 'sbstacruz-ordinances' | 'sbstacruz-resolutions';
  pageUrl: string;
  endpointUrl: string | null;
  httpStatus: number | null;
  rawPayload: RawLegislationPayload;
  runId: string;
  collectedAt: string;
}): CollectionObservation {
  const parsed = parseNumberLabel(input.rawPayload.numberLabel);
  const hash = contentHash(input.rawPayload);
  const logicalKey = logicalRecordKey({
    documentType: input.documentType,
    sourceNativeId: input.rawPayload.sourceNativeId,
    detailUrl: input.rawPayload.detailUrl,
    documentUrl: input.rawPayload.documentUrl,
    parsedNumber: parsed.parsedNumber,
    seriesCode: parsed.seriesCode,
    seriesYear: parsed.seriesYear,
  });
  const observationSuffix = contentHash({ logicalKey, hash }).slice(-24);

  return {
    observationId: `obs_${input.sourceKey}_${observationSuffix}`,
    sourceId: input.sourceId,
    sourceKey: input.sourceKey,
    municipality: {
      name: 'Santa Cruz',
      province: 'Laguna',
      psgc10: '0403426000',
    },
    logicalRecordKey: logicalKey,
    sourceNativeId: normalizeText(input.rawPayload.sourceNativeId) || null,
    sourceRecordUrl: safeUrl(input.rawPayload.detailUrl),
    collectedAt: input.collectedAt,
    collectorVersion: COLLECTOR_VERSION,
    runId: input.runId,
    contentHash: hash,
    rawPayload: input.rawPayload,
    transport: {
      pageUrl: input.pageUrl,
      endpointUrl: input.endpointUrl,
      httpStatus: input.httpStatus,
    },
  };
}

export function toStagedLegislation(
  observation: CollectionObservation,
  documentType: DocumentType
): StagedLegislation {
  const raw = observation.rawPayload as RawLegislationPayload;
  const parsed = parseNumberLabel(raw.numberLabel);
  const titleRaw = normalizeText(raw.title);
  const authors = normalizeNames(raw.authors);
  const coAuthors = normalizeNames(raw.coAuthors);
  const tags = normalizeTags(raw.tags);
  const document = classifyDocumentState(raw.actionText, raw.documentUrl);
  const dateEnacted = parseExplicitDate(raw.approvedDate);
  const dateEvidence = dateEnacted ? 'explicit-field' : 'unknown';
  const anomalies = detectAnomalies({
    parsed,
    titleRaw,
    dateEnacted,
    authors,
    coAuthors,
    document,
    collectedAt: observation.collectedAt,
  });

  const candidateDocumentKey =
    parsed.parsedNumber && parsed.seriesCode && parsed.seriesYear
      ? [
          documentType,
          parsed.seriesYear,
          parsed.seriesCode,
          parsed.parsedNumber,
        ].join('|')
      : observation.logicalRecordKey;

  return {
    stagedId: `staged_${observation.observationId}`,
    observationId: observation.observationId,
    municipality: observation.municipality,
    documentType,
    sourceNativeId: observation.sourceNativeId,
    rawNumberLabel: parsed.rawNumberLabel,
    parsedNumber: parsed.parsedNumber,
    seriesCode: parsed.seriesCode,
    seriesYear: parsed.seriesYear,
    candidateDocumentKey,
    titleRaw,
    titleNormalized: normalizeTitle(titleRaw),
    languageHint: languageHintFor(parsed.rawNumberLabel, titleRaw),
    dateEnacted,
    dateEvidence,
    authors,
    coAuthors,
    tagsRaw: tags.tagsRaw,
    tagsNormalized: tags.tagsNormalized,
    document,
    evidence: {
      sourceIds: [observation.sourceId],
      verification: 'single-source',
      assertionType: 'direct',
    },
    publication: {
      state: 'staged',
    },
    anomalies,
    contentHash: observation.contentHash,
    firstSeenAt: observation.collectedAt,
    lastSeenAt: observation.collectedAt,
  };
}
