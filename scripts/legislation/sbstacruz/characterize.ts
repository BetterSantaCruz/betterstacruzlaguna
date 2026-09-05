import fs from 'node:fs';
import path from 'node:path';

import { chromium, type Page, type Response } from '@playwright/test';

const DEFAULT_OUTPUT =
  'pipeline/openlgu/sbstacruz-legislation/characterization/characterization.json';
const DEFAULT_WAIT_MS = 8_000;
const MAX_BODY_SAMPLE_BYTES = 200_000;
const ALLOWED_HOST = /(^|\.)sbstacruz\.com$/i;

const TARGETS = [
  {
    key: 'ordinances',
    url: 'https://www.sbstacruz.com/ordinances',
  },
  {
    key: 'resolutions',
    url: 'https://www.sbstacruz.com/resolutions',
  },
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

type PageCharacterization = {
  key: string;
  pageUrl: string;
  navigationStatus: number | null;
  finalUrl: string;
  title: string;
  santaCruzMarkers: string[];
  lumbanLogoAltCount: number;
  tableHeaders: string[];
  renderedDataRowCount: number;
  selectNames: string[];
  inputNames: string[];
  paginationLabels: string[];
  sameSiteNetwork: SafeNetworkObservation[];
  candidateDataResponses: SafeNetworkObservation[];
  error: string | null;
};

function parseArgs(argv: string[]) {
  const args = {
    output: DEFAULT_OUTPUT,
    waitMs: DEFAULT_WAIT_MS,
  };

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
      console.log(`Usage: tsx scripts/legislation/sbstacruz/characterize.ts [options]

Characterizes the normal unauthenticated browser transport used by the public
Santa Cruz SB ordinance and resolution pages. It does not authenticate, submit
forms, paginate through the corpus, or bypass access controls.

Options:
  --output <path>   Characterization JSON output. Default: ${DEFAULT_OUTPUT}
  --wait-ms <ms>    Bounded wait after page load. Default: ${DEFAULT_WAIT_MS}
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function redactSensitiveQueryValues(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    for (const key of [...url.searchParams.keys()]) {
      if (/token|csrf|auth|session|signature|secret|key/i.test(key)) {
        url.searchParams.set(key, '<redacted>');
      }
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function summarizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return {
      kind: 'array',
      length: value.length,
      firstItem: value.length > 0 ? summarizeJson(value[0]) : null,
    };
  }

  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const keys = Object.keys(object).slice(0, 40);
    const summary: Record<string, unknown> = {
      kind: 'object',
      keys,
    };

    for (const candidate of [
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
      if (candidate in object) {
        summary[candidate] = summarizeJson(object[candidate]);
      }
    }

    return summary;
  }

  if (typeof value === 'string') {
    return value.length <= 120
      ? { kind: 'string', sample: value }
      : { kind: 'string', length: value.length };
  }

  return { kind: typeof value, value };
}

async function summarizeResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers()['content-type'] ?? '';
  const resourceType = response.request().resourceType();
  if (!['xhr', 'fetch'].includes(resourceType)) return null;

  try {
    const body = await response.body();
    if (body.byteLength > MAX_BODY_SAMPLE_BYTES) {
      return {
        kind: 'body-too-large',
        bytes: body.byteLength,
      };
    }

    const text = body.toString('utf8');
    if (/json/i.test(contentType)) {
      try {
        return summarizeJson(JSON.parse(text));
      } catch {
        return {
          kind: 'invalid-json',
          bytes: body.byteLength,
        };
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

async function inspectDom(page: Page) {
  return page.evaluate(() => {
    const clean = (value: string | null | undefined) =>
      String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim();

    const bodyText = clean(document.body?.innerText);
    const santaCruzMarkers = [
      'Santa Cruz',
      'Laguna',
      'Republic of the Philippines',
    ].filter(marker => bodyText.toLowerCase().includes(marker.toLowerCase()));

    const table = document.querySelector('table');
    const tableHeaders = table
      ? [...table.querySelectorAll('thead th, tr:first-child th')]
          .map(cell => clean(cell.textContent))
          .filter(Boolean)
      : [];

    const renderedDataRowCount = table
      ? table.querySelectorAll('tbody tr').length
      : 0;

    const lumbanLogoAltCount = [...document.querySelectorAll('img')].filter(img =>
      /lumban\s+logo/i.test(img.getAttribute('alt') ?? '')
    ).length;

    const selectNames = [...document.querySelectorAll('select')]
      .map(element =>
        clean(
          element.getAttribute('name') ||
            element.getAttribute('id') ||
            element.getAttribute('aria-label')
        )
      )
      .filter(Boolean);

    const inputNames = [...document.querySelectorAll('input')]
      .map(element =>
        clean(
          element.getAttribute('name') ||
            element.getAttribute('id') ||
            element.getAttribute('placeholder') ||
            element.getAttribute('aria-label')
        )
      )
      .filter(Boolean);

    const paginationLabels = [
      ...document.querySelectorAll(
        '[aria-label*="page" i], .pagination a, .pagination button, [class*="paginate"] a, [class*="paginate"] button'
      ),
    ]
      .map(element => clean(element.textContent || element.getAttribute('aria-label')))
      .filter(Boolean)
      .slice(0, 40);

    return {
      santaCruzMarkers,
      lumbanLogoAltCount,
      tableHeaders,
      renderedDataRowCount,
      selectNames,
      inputNames,
      paginationLabels,
    };
  });
}

async function characterizeTarget(
  page: Page,
  target: (typeof TARGETS)[number],
  waitMs: number
): Promise<PageCharacterization> {
  const network: SafeNetworkObservation[] = [];
  const pendingBodyReads: Promise<void>[] = [];

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
    await page.waitForTimeout(waitMs);
    await Promise.allSettled(pendingBodyReads);

    const dom = await inspectDom(page);
    const candidateDataResponses = network.filter(observation =>
      ['xhr', 'fetch'].includes(observation.resourceType)
    );

    return {
      key: target.key,
      pageUrl: target.url,
      navigationStatus: navigation?.status() ?? null,
      finalUrl: redactSensitiveQueryValues(page.url()),
      title: await page.title(),
      ...dom,
      sameSiteNetwork: network,
      candidateDataResponses,
      error: null,
    };
  } catch (error) {
    await Promise.allSettled(pendingBodyReads);
    return {
      key: target.key,
      pageUrl: target.url,
      navigationStatus: null,
      finalUrl: redactSensitiveQueryValues(page.url()),
      title: await page.title().catch(() => ''),
      santaCruzMarkers: [],
      lumbanLogoAltCount: 0,
      tableHeaders: [],
      renderedDataRowCount: 0,
      selectNames: [],
      inputNames: [],
      paginationLabels: [],
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
    schemaVersion: 1,
    characterizedAt: new Date().toISOString(),
    method: 'normal-unauthenticated-playwright-browser-load',
    interactionsPerformed: [],
    limitations: [
      'No authentication was used.',
      'No pagination, search, or filter controls were submitted in this characterization run.',
      'No request or response headers containing cookies/authorization data were persisted.',
      'Query values whose key resembles token/csrf/auth/session/signature/secret/key are redacted.',
    ],
    targets: results,
  };

  const resolved = path.resolve(args.output);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(output, null, 2)}\n`);

  const logSummary = results.map(result => ({
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
  }));

  console.log(JSON.stringify(logSummary, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
