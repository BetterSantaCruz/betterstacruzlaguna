import { z } from 'zod';

import {
  SOURCES,
  assertAllowedUrl,
  rowToRawPayload,
  type SourceKey,
} from './collector';
import {
  COLLECTOR_VERSION,
  normalizeText,
  toCollectionObservation,
  toStagedLegislation,
} from './parse';
import {
  collectionRunManifestSchema,
  type CollectionObservation,
  type CollectionRunManifest,
  type StagedLegislation,
} from './schemas';

const BASE_URL = 'https://www.sbstacruz.com';
const MINIMUM_DELAY_MS = 2_500;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES_AFTER_INITIAL = 2;
const HARD_WINDOW_LIMIT = 20;

type FetchLike = typeof fetch;
type SleepLike = (milliseconds: number) => Promise<void>;

export type PilotYearWindowResult = {
  sourceKey: SourceKey;
  sourceId: string;
  year: number;
  dateFilter: {
    fromDate: string;
    toDate: string;
  };
  recordsTotal: number | null;
  recordsFiltered: number | null;
  observations: CollectionObservation[];
  staged: StagedLegislation[];
  manifest: CollectionRunManifest;
  warnings: string[];
};

const responseSchema = z.object({
  draw: z.number(),
  recordsTotal: z.number().int().nonnegative(),
  recordsFiltered: z.number().int().nonnegative(),
  data: z.array(z.array(z.unknown()).length(7)),
});

class PilotWindowFailure extends Error {
  constructor(
    message: string,
    readonly kind:
      | 'http_403'
      | 'http_429'
      | 'http_error'
      | 'network_error'
      | 'unexpected_response_shape'
      | 'source_identity_mismatch'
  ) {
    super(message);
    this.name = 'PilotWindowFailure';
  }
}

function defaultSleep(milliseconds: number) {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

function retryAfterMilliseconds(value: string | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;

  const retryAt = Date.parse(trimmed);
  if (Number.isNaN(retryAt)) return null;
  return Math.max(0, retryAt - Date.now());
}

async function fetchWithPolicy(options: {
  url: string;
  sourceKey: SourceKey;
  fetchImpl: FetchLike;
  sleep: SleepLike;
  recordStatus: (status: number) => void;
}): Promise<Response> {
  const source = SOURCES[options.sourceKey];
  const url = assertAllowedUrl(options.url, source);
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES_AFTER_INITIAL; attempt += 1) {
    try {
      const response = await options.fetchImpl(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
          'User-Agent':
            'BetterSantaCruz-evidence-staging/0.1 (+https://github.com/BetterSantaCruz/betterstacruzlaguna)',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.status === 403 || response.status === 429) {
        options.recordStatus(response.status);
      }

      if (response.status === 403) {
        throw new PilotWindowFailure(
          `HTTP 403 from ${url.pathname}; stopping immediately`,
          'http_403'
        );
      }

      if (response.status === 429) {
        const retryAfterMs = retryAfterMilliseconds(
          response.headers.get('retry-after')
        );
        if (
          attempt === 0 &&
          retryAfterMs !== null &&
          retryAfterMs <= REQUEST_TIMEOUT_MS
        ) {
          await options.sleep(Math.max(MINIMUM_DELAY_MS, retryAfterMs));
          continue;
        }

        throw new PilotWindowFailure(
          `HTTP 429 from ${url.pathname}; stopping after bounded Retry-After handling`,
          'http_429'
        );
      }

      if (response.status >= 500 && response.status <= 599) {
        lastError = new PilotWindowFailure(
          `HTTP ${response.status} from ${url.pathname}`,
          'http_error'
        );
        if (attempt < MAX_RETRIES_AFTER_INITIAL) {
          await options.sleep(
            Math.max(MINIMUM_DELAY_MS, 1_000 * 2 ** attempt)
          );
          continue;
        }
        throw lastError;
      }

      if (!response.ok) {
        throw new PilotWindowFailure(
          `HTTP ${response.status} from ${url.pathname}`,
          'http_error'
        );
      }

      return response;
    } catch (error) {
      if (error instanceof PilotWindowFailure) throw error;
      lastError = error;
      if (attempt < MAX_RETRIES_AFTER_INITIAL) {
        await options.sleep(
          Math.max(MINIMUM_DELAY_MS, 1_000 * 2 ** attempt)
        );
        continue;
      }
    }
  }

  throw new PilotWindowFailure(
    `Network request failed after ${MAX_RETRIES_AFTER_INITIAL + 1} attempts: ${String(lastError)}`,
    'network_error'
  );
}

function buildYearWindowUrl(
  sourceKey: SourceKey,
  year: number,
  length: number
): string {
  const source = SOURCES[sourceKey];
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

  url.searchParams.set('order[0][column]', '3');
  url.searchParams.set('order[0][dir]', 'desc');
  url.searchParams.set('start', '0');
  url.searchParams.set('length', String(length));
  url.searchParams.set('search[value]', '');
  url.searchParams.set('search[regex]', 'false');
  url.searchParams.set('titleFilter', '');
  url.searchParams.set('authorFilter', '');
  url.searchParams.set('coauthorFilter', '');
  url.searchParams.set('tagFilter', '');
  url.searchParams.set('from_date', `${year}-01-01`);
  url.searchParams.set('to_date', `${year}-12-31`);

  return url.toString();
}

function expectedSourceType(sourceKey: SourceKey): RegExp {
  return sourceKey === 'ordinances'
    ? /^(?:ordinance|kautusang\s+bayan)$/i
    : /^(?:resolution|kapasiyahan)$/i;
}

export async function collectPilotYearWindow(options: {
  sourceKey: SourceKey;
  year: number;
  limit: number;
  fetchImpl?: FetchLike;
  sleep?: SleepLike;
  now?: () => Date;
}): Promise<PilotYearWindowResult> {
  if (!Number.isInteger(options.year) || options.year < 1900 || options.year > 2100) {
    throw new Error('year must be an integer between 1900 and 2100');
  }
  if (
    !Number.isInteger(options.limit) ||
    options.limit < 1 ||
    options.limit > HARD_WINDOW_LIMIT
  ) {
    throw new Error(`limit must be between 1 and ${HARD_WINDOW_LIMIT}`);
  }

  const source = SOURCES[options.sourceKey];
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const runId = `${source.sourceKey}-${options.year}-${startedAt.replace(/[:.]/g, '-')}`;
  const observations: CollectionObservation[] = [];
  const staged: StagedLegislation[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  let http403 = 0;
  let http429 = 0;
  let shapeFailures = 0;
  let recordsTotal: number | null = null;
  let recordsFiltered: number | null = null;
  let status: 'success' | 'partial' | 'failed' = 'success';
  let errorMessage: string | null = null;

  const recordStatus = (responseStatus: number) => {
    if (responseStatus === 403) http403 += 1;
    if (responseStatus === 429) http429 += 1;
  };

  try {
    const pageResponse = await fetchWithPolicy({
      url: source.pageUrl,
      sourceKey: options.sourceKey,
      fetchImpl,
      sleep,
      recordStatus,
    });
    const pageText = (await pageResponse.text()).toLowerCase();
    if (!pageText.includes('santa cruz') || !pageText.includes('laguna')) {
      throw new PilotWindowFailure(
        'Source page did not contain both Santa Cruz and Laguna identity markers',
        'source_identity_mismatch'
      );
    }

    await sleep(MINIMUM_DELAY_MS);

    const endpointUrl = buildYearWindowUrl(
      options.sourceKey,
      options.year,
      options.limit
    );
    const response = await fetchWithPolicy({
      url: endpointUrl,
      sourceKey: options.sourceKey,
      fetchImpl,
      sleep,
      recordStatus,
    });

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new PilotWindowFailure(
        'SB DataTables year-window request returned non-JSON content',
        'unexpected_response_shape'
      );
    }

    const parsed = responseSchema.safeParse(json);
    if (!parsed.success) {
      throw new PilotWindowFailure(
        `Unexpected SB DataTables response shape: ${parsed.error.issues
          .map(issue => issue.path.join('.') || issue.message)
          .join(', ')}`,
        'unexpected_response_shape'
      );
    }

    recordsTotal = parsed.data.recordsTotal;
    recordsFiltered = parsed.data.recordsFiltered;

    if (parsed.data.data.length < options.limit) {
      warnings.push(
        `Year ${options.year} returned ${parsed.data.data.length} rows for requested pilot limit ${options.limit}; source reports ${parsed.data.recordsFiltered} filtered rows.`
      );
    }

    for (const row of parsed.data.data.slice(0, options.limit)) {
      const rawPayload = rowToRawPayload(row);
      const collectedAt = now().toISOString();
      const observation = toCollectionObservation({
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
      const stagedRecord = toStagedLegislation(
        observation,
        source.documentType
      );

      const observedType = normalizeText(rawPayload.sourceDocumentType);
      if (!observedType || !expectedSourceType(options.sourceKey).test(observedType)) {
        stagedRecord.anomalies.push({
          code: 'source_identity_mismatch',
          severity: 'blocking',
          note: `Expected ${source.documentType}; source Details Type was ${observedType || '(missing)'}`,
        });
      }

      if (observation.sourceNativeId && seenIds.has(observation.sourceNativeId)) {
        stagedRecord.anomalies.push({
          code: 'duplicate_logical_key',
          severity: 'blocking',
          note: `Duplicate source-native id ${observation.sourceNativeId} in bounded year window`,
        });
      }
      if (observation.sourceNativeId) seenIds.add(observation.sourceNativeId);

      observations.push(observation);
      staged.push(stagedRecord);
    }

    if (observations.length !== options.limit) status = 'partial';
  } catch (error) {
    status = observations.length > 0 ? 'partial' : 'failed';
    errorMessage = error instanceof Error ? error.message : String(error);
    if (
      error instanceof PilotWindowFailure &&
      error.kind === 'unexpected_response_shape'
    ) {
      shapeFailures += 1;
    }
  }

  const manifest = collectionRunManifestSchema.parse({
    schemaVersion: 1,
    runId,
    collectorVersion: `${COLLECTOR_VERSION}-pilot-window-v1`,
    startedAt,
    finishedAt: now().toISOString(),
    sourceId: source.sourceId,
    sourcePageUrl: source.pageUrl,
    collectionMode: 'public-json',
    requestedPages: 1,
    successfulPages: status === 'failed' ? 0 : 1,
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

  return {
    sourceKey: options.sourceKey,
    sourceId: source.sourceId,
    year: options.year,
    dateFilter: {
      fromDate: `${options.year}-01-01`,
      toDate: `${options.year}-12-31`,
    },
    recordsTotal,
    recordsFiltered,
    observations,
    staged,
    manifest,
    warnings,
  };
}
