import fs from 'node:fs';
import path from 'node:path';

import { chromium, type Locator, type Page, type Response } from '@playwright/test';

const DEFAULT_OUTPUT =
  'pipeline/openlgu/sbstacruz-legislation/characterization/characterization.json';
const DEFAULT_WAIT_MS = 8_000;
const MAX_BODY_SAMPLE_BYTES = 200_000;
const MAX_DOM_VALUES = 40;
const ALLOWED_HOST = /(^|\.)sbstacruz\.com$/i;

const TARGETS = [
  { key: 'ordinances', url: 'https://www.sbstacruz.com/ordinances' },
  { key: 'resolutions', url: 'https://www.sbstacruz.com/resolutions' },
] as const;

type SafeNetworkObservation = {
  url: string;
  method: string;
  resourceType: string;
  status: number;
  contentType: string | null;
  sameSite: boolean;
  responseShape: unknown;
};

type DomObservation = {
  santaCruzMarkers: string[];
  lumbanLogoAltCount: number;
  tableHeaders: string[];
  renderedDataRowCount: number;
  selectNames: string[];
  inputNames: string[];
  paginationLabels: string[];
};

type PageCharacterization = DomObservation & {
  key: string;
  pageUrl: string;
  navigationStatus: number | null;
  finalUrl: string;
  title: string;
  sameSiteNetwork: SafeNetworkObservation[];
  candidateDataResponses: SafeNetworkObservation[];
  error: string | null;
};

function parseArgs(argv: string[]) {
  const args = { output: DEFAULT_OUTPUT, waitMs: DEFAULT_WAIT_MS };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--output' && next) {
      args.output = next;
      index += 1;
    } else if (arg === '--wait-ms' && next) {
      const value = Number.parseInt(next, 10);
      if (!Number.isFinite(value) || value < 0 || value > 30_000) {
        throw new Error('--wait-ms must be between 0 and 30000');
      }
      args.waitMs = value;
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        `Usage: tsx scripts/legislation/sbstacruz/characterize.ts [options]\n\n` +
          `Characterizes the normal unauthenticated browser transport used by the public\n` +
          `Santa Cruz SB ordinance and resolution pages. It does not authenticate, submit\n` +
          `forms, paginate through the corpus, or bypass access controls.\n\n` +
          `Options:\n` +
          `  --output <path>   Characterization JSON output. Default: ${DEFAULT_OUTPUT}\n` +
          `  --wait-ms <ms>    Bounded wait after page load. Default: ${DEFAULT_WAIT_MS}\n`
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function isSensitiveQueryKey(key: string): boolean {
  const normalized = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_.-]+/g, ' ')
    .toLowerCase();

  return /\b(token|csrf|auth|authorization|session|signature|secret|api key)\b/.test(
    normalized
  );
}

function redactSensitiveQueryValues(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    for (const key of [...url.searchParams.keys()]) {
      if (isSensitiveQueryKey(key)) url.searchParams.set(key, '<redacted>');
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function summarizeScalar(value: unknown): unknown {
  if (typeof value === 'string') {
    return {
      kind: 'string',
      length: value.length,
      sample: value.slice(0, 240),
    };
  }
  if (value === null) return { kind: 'null' };
  return { kind: typeof value, value };
}

function summarizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    const firstItem = value[0];
    return {
      kind: 'array',
      length: value.length,
      firstItem: Array.isArray(firstItem)
        ? {
            kind: 'array',
            length: firstItem.length,
            cells: firstItem.map(summarizeScalar),
          }
        : firstItem === undefined
          ? null
          : summarizeJson(firstItem),
    };
  }

  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const summary: Record<string, unknown> = {
      kind: 'object',
      keys: Object.keys(object).slice(0, 40),
    };
    for (const key of [
      'data',
      'records',
      'results',
      'items',
      'aaData',
      'recordsTotal',
      'recordsFiltered',
      'draw',
      'total',
      'current_page',
      'last_page',
    ]) {
      if (key in object) summary[key] = summarizeJson(object[key]);
    }
    return summary;
  }

  return summarizeScalar(value);
}

async function summarizeResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers()['content-type'] ?? '';
  const resourceType = response.request().resourceType();
  if (!['xhr', 'fetch'].includes(resourceType)) return null;

  try {
    const body = await response.body();
    if (body.byteLength > MAX_BODY_SAMPLE_BYTES) {
      return { kind: 'body-too-large', bytes: body.byteLength };
    }

    const text = body.toString('utf8');
    if (/json/i.test(contentType)) {
      try {
        return summarizeJson(JSON.parse(text));
      } catch {
        return { kind: 'invalid-json', bytes: body.byteLength };
      }
    }

    return {
      kind: 'text',
      bytes: body.byteLength,
      sample: text.replace(/\s+/g, ' ').slice(0, 240),
    };
  } catch (error) {
    return {
      kind: 'unavailable',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function clean(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function readLocatorLabels(locator: Locator): Promise<string[]> {
  const labels: string[] = [];
  const count = Math.min(await locator.count(), MAX_DOM_VALUES);

  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    const label = clean(
      (await item.getAttribute('name')) ??
        (await item.getAttribute('id')) ??
        (await item.getAttribute('placeholder')) ??
        (await item.getAttribute('aria-label')) ??
        (await item.textContent())
    );
    if (label) labels.push(label);
  }

  return labels;
}

function emptyDomObservation(): DomObservation {
  return {
    santaCruzMarkers: [],
    lumbanLogoAltCount: 0,
    tableHeaders: [],
    renderedDataRowCount: 0,
    selectNames: [],
    inputNames: [],
    paginationLabels: [],
  };
}

async function inspectDom(page: Page): Promise<DomObservation> {
  const bodyText = clean(await page.locator('body').innerText());
  const santaCruzMarkers = [
    'Santa Cruz',
    'Laguna',
    'Republic of the Philippines',
  ].filter(marker => bodyText.toLowerCase().includes(marker.toLowerCase()));

  const tableHeaders = (
    await page.locator('table thead th, table tr:first-child th').allTextContents()
  )
    .map(clean)
    .filter(Boolean)
    .slice(0, MAX_DOM_VALUES);

  const imageLocator = page.locator('img[alt]');
  let lumbanLogoAltCount = 0;
  const imageCount = await imageLocator.count();
  for (let index = 0; index < imageCount; index += 1) {
    const alt = await imageLocator.nth(index).getAttribute('alt');
    if (/lumban\s+logo/i.test(alt ?? '')) lumbanLogoAltCount += 1;
  }

  const pagination = page.locator(
    '[aria-label*="page" i], .pagination a, .pagination button, [class*="paginate"] a, [class*="paginate"] button'
  );

  return {
    santaCruzMarkers,
    lumbanLogoAltCount,
    tableHeaders,
    renderedDataRowCount: await page.locator('table tbody tr').count(),
    selectNames: await readLocatorLabels(page.locator('select')),
    inputNames: await readLocatorLabels(page.locator('input')),
    paginationLabels: await readLocatorLabels(pagination),
  };
}

async function characterizeTarget(
  page: Page,
  target: (typeof TARGETS)[number],
  waitMs: number
): Promise<PageCharacterization> {
  const network: SafeNetworkObservation[] = [];
  const pendingBodyReads: Promise<void>[] = [];
  let navigationStatus: number | null = null;

  const onResponse = (response: Response) => {
    const request = response.request();
    let sameSite = false;
    try {
      sameSite = ALLOWED_HOST.test(new URL(response.url()).hostname);
    } catch {
      sameSite = false;
    }
    if (!sameSite) return;

    const observation: SafeNetworkObservation = {
      url: redactSensitiveQueryValues(response.url()),
      method: request.method(),
      resourceType: request.resourceType(),
      status: response.status(),
      contentType: response.headers()['content-type'] ?? null,
      sameSite,
      responseShape: null,
    };
    network.push(observation);

    if (['xhr', 'fetch'].includes(request.resourceType())) {
      pendingBodyReads.push(
        summarizeResponseBody(response).then(shape => {
          observation.responseShape = shape;
        })
      );
    }
  };

  page.on('response', onResponse);

  try {
    const navigation = await page.goto(target.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    navigationStatus = navigation?.status() ?? null;
    await page.waitForTimeout(waitMs);
    await Promise.allSettled(pendingBodyReads);

    let dom = emptyDomObservation();
    let domError: string | null = null;
    try {
      dom = await inspectDom(page);
    } catch (error) {
      domError = `DOM inspection failed: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }

    return {
      key: target.key,
      pageUrl: target.url,
      navigationStatus,
      finalUrl: redactSensitiveQueryValues(page.url()),
      title: await page.title(),
      ...dom,
      sameSiteNetwork: network,
      candidateDataResponses: network.filter(observation =>
        ['xhr', 'fetch'].includes(observation.resourceType)
      ),
      error: domError,
    };
  } catch (error) {
    await Promise.allSettled(pendingBodyReads);
    return {
      key: target.key,
      pageUrl: target.url,
      navigationStatus,
      finalUrl: redactSensitiveQueryValues(page.url()),
      title: await page.title().catch(() => ''),
      ...emptyDomObservation(),
      sameSiteNetwork: network,
      candidateDataResponses: network.filter(observation =>
        ['xhr', 'fetch'].includes(observation.resourceType)
      ),
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    page.off('response', onResponse);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const results: PageCharacterization[] = [];

  try {
    for (const target of TARGETS) {
      const page = await context.newPage();
      results.push(await characterizeTarget(page, target, args.waitMs));
      await page.close();
      await new Promise(resolve => setTimeout(resolve, 2_500));
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const output = {
    schemaVersion: 2,
    characterizedAt: new Date().toISOString(),
    method: 'normal-unauthenticated-playwright-browser-load',
    interactionsPerformed: [],
    limitations: [
      'No authentication was used.',
      'No pagination, search, or filter controls were submitted in this characterization run.',
      'No request or response headers containing cookies/authorization data were persisted.',
      'Only query values whose key is explicitly auth/security-sensitive are redacted.',
      'XHR/fetch bodies are summarized and bounded; full response bodies are not persisted.',
    ],
    targets: results,
  };

  const resolved = path.resolve(args.output);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(output, null, 2)}\n`);

  console.log(
    JSON.stringify(
      results.map(result => ({
        key: result.key,
        navigationStatus: result.navigationStatus,
        finalUrl: result.finalUrl,
        title: result.title,
        santaCruzMarkers: result.santaCruzMarkers,
        lumbanLogoAltCount: result.lumbanLogoAltCount,
        tableHeaders: result.tableHeaders,
        renderedDataRowCount: result.renderedDataRowCount,
        candidateDataResponses: result.candidateDataResponses,
        error: result.error,
      })),
      null,
      2
    )
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
