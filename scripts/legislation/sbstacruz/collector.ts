import { load } from 'cheerio';
import { z } from 'zod';

import {
  COLLECTOR_VERSION,
  toCollectionObservation,
  toStagedLegislation,
  type DocumentType,
  type RawLegislationPayload,
} from './parse';
import {
  collectionRunManifestSchema,
  type CollectionObservation,
  type CollectionRunManifest,
  type StagedLegislation,
} from './schemas';

const BASE_URL = 'https://www.sbstacruz.com';
const HARD_MAX_RECORDS = 200;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_DELAY_MS = 2_500;
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 30_000;

export type SourceKey = 'ordinances' | 'resolutions';

type FetchLike = typeof fetch;
type SleepLike = (milliseconds: number) => Promise<void>;

export type SourceDefinition = {
  key: SourceKey;
  documentType: DocumentType;
  sourceId: 'sc-sb-ordinances' | 'sc-sb-resolutions';
  sourceKey: 'sbstacruz-ordinances' | 'sbstacruz-resolutions';
  pageUrl: string;
  endpointPath: '/ordinancesData' | '/resolutionsData';
};

export const SOURCES: Record<SourceKey, SourceDefinition> = {
  ordinances: {
    key: 'ordinances',
    documentType: 'ordinance',
    sourceId: 'sc-sb-ordinances',
    sourceKey: 'sbstacruz-ordinances',
    pageUrl: `${BASE_URL}/ordinances`,
    endpointPath: '/ordinancesData',
  },
  resolutions: {
    key: 'resolutions',
    documentType: 'resolution',
    sourceId: 'sc-sb-resolutions',
    sourceKey: 'sbstacruz-resolutions',
    pageUrl: `${BASE_URL}/resolutions`,
    endpointPath: '/resolutionsData',
  },
};

const dataTablesResponseSchema = z.object({
  draw: z.number(),
  recordsTotal: z.number().int().nonnegative(),
  recordsFiltered: z.number().int().nonnegative(),
  data: z.array(z.array(z.unknown()).length(7)),
});

type DataTablesResponse = z.infer<typeof dataTablesResponseSchema>;

export type CollectorWarning = {
  code:
    | 'pagination_gap'
    | 'duplicate_source_native_id'
    | 'duplicate_logical_key';
  message: string;
};

export type CollectionResult = {
  source: SourceDefinition;
  observations: CollectionObservation[];
  staged: StagedLegislation[];
  manifest: CollectionRunManifest;
  warnings: CollectorWarning[];
};

export class CollectorFailure extends Error {
  constructor(
    message: string,
    readonly kind:
      | 'http_403'
      | 'http_429'
      | 'http_error'
      | 'network_error'
      | 'unexpected_response_shape'
      | 'source_identity_mismatch'
      | 'unsafe_url'
  ) {
    super(message);
    this.name = 'CollectorFailure';
  }
}

function defaultSleep(milliseconds: number) {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

export function assertAllowedUrl(
  rawUrl: string,
  source: SourceDefinition
): URL {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'www.sbstacruz.com') {
    throw new CollectorFailure(
      `Collector refused non-whitelisted host: ${url.hostname}`,
      'unsafe_url'
    );
  }

  const allowedPaths = new Set([
    new URL(source.pageUrl).pathname,
    source.endpointPath,
  ]);
  if (!allowedPaths.has(url.pathname)) {
    throw new CollectorFailure(
      `Collector refused non-whitelisted path: ${url.pathname}`,
      'unsafe_url'
    );
  }

  return url;
}

function buildDataTablesUrl(
  source: SourceDefinition,
  start: number,
  length: number
): string {
  const url = new URL(source.endpointPath, BASE_URL);
  url.searchParams.set('draw', '1');

  for (let index = 0; index < 7; index += 1) {
    url.searchParams.set(`columns[${index}][data]`, String(index));
    url.searchParams.set(`columns[${index}][name]`, '');
    url.searchParams.set(`columns[${index}][searchable]`, 'true');
    url.searchParams.set(
      `columns[${index}][orderable]`,
      index === 6 ? 'false' : 'true'
    );
    url.searchParams.set(`columns[${index}][search][value]`, '');
    url.searchParams.set(`columns[${index}][search][regex]`, 'false');
  }

  // Preserve the exact ordering/filter shape observed during characterization.
  // We do not guess a semantic meaning for column 3; it is only an upstream
  // DataTables ordering parameter observed in the public browser request.
  url.searchParams.set('order[0][column]', '3');
  url.searchParams.set('order[0][dir]', 'desc');
  url.searchParams.set('start', String(start));
  url.searchParams.set('length', String(length));
  url.searchParams.set('search[value]', '');
  url.searchParams.set('search[regex]', 'false');
  url.searchParams.set('titleFilter', '');
  url.searchParams.set('authorFilter', '');
  url.searchParams.set('coauthorFilter', '');
  url.searchParams.set('tagFilter', '');
  url.searchParams.set('to_date', '');
  url.searchParams.set('from_date', '');
  return url.toString();
}

function cleanText(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlText(value: unknown): string {
  const $ = load(`<body>${String(value ?? '')}</body>`);
  return cleanText($('body').text());
}

function htmlLines(value: unknown): string[] {
  const $ = load(`<body>${String(value ?? '')}</body>`);
  $('br').replaceWith('\n');
  $('li').each((_, element) => {
    $(element).append('\n');
  });
  return $('body')
    .text()
    .replace(/\u00a0/g, ' ')
    .split(/\r?\n/)
    .map(cleanText)
    .filter(Boolean);
}

function firstHref(value: unknown): string | null {
  const $ = load(`<body>${String(value ?? '')}</body>`);
  const href = $('a[href]').first().attr('href');
  if (!href) return null;

  try {
    const url = new URL(href, BASE_URL);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function valueAfterLabel(lines: string[], label: RegExp): string | null {
  for (let index = 0; index < lines.length; index += 1) {
    if (label.test(lines[index])) {
      return lines[index + 1] ?? null;
    }
  }
  return null;
}

export type ParsedDetailsCell = {
  sourceDocumentType: string | null;
  numberLabel: string;
  sourceCategory: string | null;
};

export function parseDetailsCell(value: unknown): ParsedDetailsCell {
  const lines = htmlLines(value);
  return {
    sourceDocumentType: valueAfterLabel(lines, /^type\s*:?$/i),
    numberLabel: valueAfterLabel(lines, /^number\s*:?$/i) ?? '',
    sourceCategory: valueAfterLabel(lines, /^category\s*:?$/i),
  };
}

function namesUnderHeading(value: unknown, headingPattern: RegExp): string[] {
  const $ = load(`<body>${String(value ?? '')}</body>`);
  const names: string[] = [];

  $('b, strong').each((_, heading) => {
    const headingText = cleanText($(heading).text());
    if (!headingPattern.test(headingText)) return;

    let sibling = $(heading).next();
    while (sibling.length > 0) {
      if (sibling.is('b, strong')) break;

      const candidates = sibling.is('ul, ol')
        ? sibling.find('li')
        : sibling.find('li');
      candidates.each((__, item) => {
        const name = cleanText($(item).text());
        if (name) names.push(name);
      });
      sibling = sibling.next();
    }
  });

  return [...new Set(names)];
}

export type ParsedSponsorsCell = {
  mainSponsors: string[];
  coSponsors: string[];
};

export function parseSponsorsCell(value: unknown): ParsedSponsorsCell {
  return {
    mainSponsors: namesUnderHeading(value, /^main\s+sponsor(?:\(s\))?\s*:?$/i),
    coSponsors: namesUnderHeading(value, /^co[-\s]?sponsor(?:\(s\))?\s*:?$/i),
  };
}

function parseTagsCell(value: unknown): string[] {
  const $ = load(`<body>${String(value ?? '')}</body>`);
  const badgeTags = $('[class*="badge"]')
    .map((_, element) => cleanText($(element).text()))
    .get()
    .filter(Boolean);

  if (badgeTags.length > 0) return [...new Set(badgeTags)];
  return [...new Set(htmlLines(value))];
}

export function rowToRawPayload(row: unknown[]): RawLegislationPayload {
  if (row.length !== 7) {
    throw new CollectorFailure(
      `Expected seven DataTables columns, received ${row.length}`,
      'unexpected_response_shape'
    );
  }

  const details = parseDetailsCell(row[1]);
  const sponsors = parseSponsorsCell(row[3]);
  const actionText = htmlText(row[6]);
  const actionHref = firstHref(row[6]);
  const isRequestCopy = /request\s+(?:a\s+)?copy/i.test(actionText);

  return {
    sourceNativeId: cleanText(row[0]),
    // The characterized Details column is structured metadata, not a record
    // hyperlink. Keep detailUrl null rather than fabricating a detail route.
    detailUrl: null,
    numberLabel: details.numberLabel,
    title: htmlText(row[2]),
    // These roles are explicitly labelled by the source. Mapping them is an
    // observation, not an inference from names or unrelated author pages.
    authors: sponsors.mainSponsors,
    coAuthors: sponsors.coSponsors,
    tags: parseTagsCell(row[4]),
    approvedDate: htmlText(row[5]),
    actionText,
    // "Request a Copy" is not a public document URL. Preserve its href only
    // as raw source evidence and keep documentUrl null.
    documentUrl: isRequestCopy ? null : actionHref,
    sourceDocumentType: details.sourceDocumentType,
    sourceCategory: details.sourceCategory,
    rawActionHref: actionHref,
    rawRow: row,
    rawColumns: {
      id: row[0],
      details: row[1],
      title: row[2],
      sponsors: row[3],
      tags: row[4],
      approved: row[5],
      action: row[6],
    },
  };
}

function retryAfterDelayMs(value: string | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;

  const retryAt = Date.parse(trimmed);
  if (Number.isNaN(retryAt)) return null;
  return Math.max(0, retryAt - Date.now());
}

async function fetchWithPolicy(
  rawUrl: string,
  source: SourceDefinition,
  fetchImpl: FetchLike,
  sleep: SleepLike
): Promise<Response> {
  const url = assertAllowedUrl(rawUrl, source);
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
          'User-Agent':
            'BetterSantaCruz-evidence-staging/0.1 (+https://github.com/BetterSantaCruz/betterstacruzlaguna)',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.status === 403) {
        throw new CollectorFailure(
          `HTTP 403 from ${url.pathname}; stopping immediately`,
          'http_403'
        );
      }
      if (response.status === 429) {
        const retryAfterMs = retryAfterDelayMs(
          response.headers.get('retry-after')
        );

        if (
          attempt === 0 &&
          retryAfterMs !== null &&
          retryAfterMs <= REQUEST_TIMEOUT_MS
        ) {
          await sleep(retryAfterMs);
          continue;
        }

        throw new CollectorFailure(
          `HTTP 429 from ${url.pathname}; stopping after bounded Retry-After handling`,
          'http_429'
        );
      }
      if (response.status >= 500 && response.status <= 599) {
        lastError = new CollectorFailure(
          `HTTP ${response.status} from ${url.pathname}`,
          'http_error'
        );
        if (attempt < MAX_RETRIES) {
          await sleep(1_000 * 2 ** attempt);
          continue;
        }
        throw lastError;
      }
      if (!response.ok) {
        throw new CollectorFailure(
          `HTTP ${response.status} from ${url.pathname}`,
          'http_error'
        );
      }

      return response;
    } catch (error) {
      if (error instanceof CollectorFailure) throw error;
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(1_000 * 2 ** attempt);
        continue;
      }
    }
  }

  throw new CollectorFailure(
    `Network request failed after ${MAX_RETRIES + 1} attempts: ${String(
      lastError
    )}`,
    'network_error'
  );
}

async function verifySourceIdentity(
  source: SourceDefinition,
  fetchImpl: FetchLike,
  sleep: SleepLike
): Promise<void> {
  const response = await fetchWithPolicy(
    source.pageUrl,
    source,
    fetchImpl,
    sleep
  );
  const text = (await response.text()).toLowerCase();
  if (!text.includes('santa cruz') || !text.includes('laguna')) {
    throw new CollectorFailure(
      'Source page did not contain both Santa Cruz and Laguna identity markers',
      'source_identity_mismatch'
    );
  }
}

async function fetchDataPage(
  source: SourceDefinition,
  start: number,
  length: number,
  fetchImpl: FetchLike,
  sleep: SleepLike
): Promise<DataTablesResponse> {
  const endpoint = buildDataTablesUrl(source, start, length);
  const response = await fetchWithPolicy(endpoint, source, fetchImpl, sleep);
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new CollectorFailure(
      'SB DataTables endpoint returned non-JSON content',
      'unexpected_response_shape'
    );
  }

  const parsed = dataTablesResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new CollectorFailure(
      `Unexpected SB DataTables response shape: ${parsed.error.issues
        .map(issue => issue.path.join('.') || issue.message)
        .join(', ')}`,
      'unexpected_response_shape'
    );
  }

  return parsed.data;
}

function expectedSourceType(documentType: DocumentType): RegExp {
  return documentType === 'ordinance'
    ? /^(?:ordinance|kautusang\s+bayan)$/i
    : /^(?:resolution|kapasiyahan)$/i;
}

export async function collectSource(options: {
  sourceKey: SourceKey;
  limit: number;
  fetchImpl?: FetchLike;
  sleep?: SleepLike;
  delayMs?: number;
  now?: () => Date;
}): Promise<CollectionResult> {
  const source = SOURCES[options.sourceKey];
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const delayMs = Math.max(
    options.delayMs ?? DEFAULT_DELAY_MS,
    DEFAULT_DELAY_MS
  );
  const now = options.now ?? (() => new Date());

  if (!Number.isInteger(options.limit) || options.limit < 1) {
    throw new Error('limit must be a positive integer');
  }
  if (options.limit > HARD_MAX_RECORDS) {
    throw new Error(
      `limit ${options.limit} exceeds hard safety cap ${HARD_MAX_RECORDS}`
    );
  }

  const startedAt = now().toISOString();
  const runId = `${source.sourceKey}-${startedAt.replace(/[:.]/g, '-')}`;
  const observations: CollectionObservation[] = [];
  const staged: StagedLegislation[] = [];
  const warnings: CollectorWarning[] = [];
  const sourceIds = new Set<string>();
  const logicalKeys = new Set<string>();
  let requestedPages = 0;
  let successfulPages = 0;
  let http429 = 0;
  let http403 = 0;
  let shapeFailures = 0;
  let status: 'success' | 'partial' | 'failed' = 'success';
  let errorMessage: string | null = null;

  try {
    await verifySourceIdentity(source, fetchImpl, sleep);
    await sleep(delayMs);

    let start = 0;
    let expectedFilteredTotal: number | null = null;

    while (observations.length < options.limit) {
      const length = Math.min(
        DEFAULT_PAGE_SIZE,
        options.limit - observations.length
      );
      requestedPages += 1;
      const response = await fetchDataPage(
        source,
        start,
        length,
        fetchImpl,
        sleep
      );
      successfulPages += 1;
      expectedFilteredTotal = response.recordsFiltered;

      if (response.data.length === 0) {
        if (start < response.recordsFiltered) {
          warnings.push({
            code: 'pagination_gap',
            message: `Received zero rows at offset ${start} while source reports ${response.recordsFiltered} filtered records`,
          });
        }
        break;
      }

      for (const row of response.data) {
        if (observations.length >= options.limit) break;
        const rawPayload = rowToRawPayload(row);
        const collectedAt = now().toISOString();
        const observed = toCollectionObservation({
          documentType: source.documentType,
          sourceId: source.sourceId,
          sourceKey: source.sourceKey,
          pageUrl: source.pageUrl,
          endpointUrl: new URL(source.endpointPath, BASE_URL).toString(),
          httpStatus: 200,
          rawPayload,
          runId,
          collectedAt,
        });
        const stagedRecord = toStagedLegislation(observed, source.documentType);

        const sourceDocumentType = cleanText(rawPayload.sourceDocumentType);
        if (
          !sourceDocumentType ||
          !expectedSourceType(source.documentType).test(sourceDocumentType)
        ) {
          stagedRecord.anomalies.push({
            code: 'source_identity_mismatch',
            severity: 'blocking',
            note: `Expected ${source.documentType}; source Details Type was ${
              sourceDocumentType || '(missing)'
            }`,
          });
        }

        if (observed.sourceNativeId && sourceIds.has(observed.sourceNativeId)) {
          warnings.push({
            code: 'duplicate_source_native_id',
            message: `Duplicate source-native id ${observed.sourceNativeId}`,
          });
        }
        if (logicalKeys.has(observed.logicalRecordKey)) {
          stagedRecord.anomalies.push({
            code: 'duplicate_logical_key',
            severity: 'blocking',
            note: `Duplicate logical key ${observed.logicalRecordKey} in collection run`,
          });
          warnings.push({
            code: 'duplicate_logical_key',
            message: `Duplicate logical key ${observed.logicalRecordKey}`,
          });
        }

        if (observed.sourceNativeId) sourceIds.add(observed.sourceNativeId);
        logicalKeys.add(observed.logicalRecordKey);
        observations.push(observed);
        staged.push(stagedRecord);
      }

      start += response.data.length;
      if (
        response.data.length < length ||
        start >= response.recordsFiltered ||
        observations.length >= options.limit
      ) {
        break;
      }
      await sleep(delayMs);
    }

    if (
      expectedFilteredTotal !== null &&
      observations.length < options.limit &&
      observations.length < expectedFilteredTotal
    ) {
      status = 'partial';
    }
  } catch (error) {
    status = observations.length > 0 ? 'partial' : 'failed';
    errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof CollectorFailure) {
      if (error.kind === 'http_403') http403 += 1;
      if (error.kind === 'http_429') http429 += 1;
      if (error.kind === 'unexpected_response_shape') shapeFailures += 1;
    }
  }

  const manifest = collectionRunManifestSchema.parse({
    schemaVersion: 1,
    runId,
    collectorVersion: COLLECTOR_VERSION,
    startedAt,
    finishedAt: now().toISOString(),
    sourceId: source.sourceId,
    sourcePageUrl: source.pageUrl,
    collectionMode: 'public-json',
    requestedPages,
    successfulPages,
    recordsObserved: observations.length,
    recordsStaged: staged.length,
    recordsWithAnomalies: staged.filter(record => record.anomalies.length > 0)
      .length,
    http429,
    http403,
    shapeFailures,
    status,
    error: errorMessage,
  });

  return { source, observations, staged, manifest, warnings };
}
