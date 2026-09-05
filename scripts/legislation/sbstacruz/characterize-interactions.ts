import fs from 'node:fs';
import path from 'node:path';

import { chromium, type Page, type Response } from '@playwright/test';

const DEFAULT_OUTPUT =
  'pipeline/openlgu/sbstacruz-legislation/characterization/interactions.json';
const WAIT_MS = 2_500;
const ALLOWED_HOST = 'www.sbstacruz.com';

const TARGETS = [
  { key: 'ordinances', url: 'https://www.sbstacruz.com/ordinances' },
  { key: 'resolutions', url: 'https://www.sbstacruz.com/resolutions' },
] as const;

type ProbeName =
  | 'initial-load'
  | 'next-page'
  | 'date-filter-2024'
  | 'title-filter'
  | 'tag-filter';

type NetworkObservation = {
  probe: ProbeName;
  url: string;
  method: string;
  status: number;
  contentType: string | null;
};

type ProbeResult = {
  probe: ProbeName;
  attempted: boolean;
  interaction: string;
  error: string | null;
  xhr: NetworkObservation[];
};

function parseArgs(argv: string[]) {
  let output = DEFAULT_OUTPUT;
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--output' && next) {
      output = next;
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        `Usage: tsx scripts/legislation/sbstacruz/characterize-interactions.ts [options]\n\n` +
          `Runs a small normal-browser interaction probe against the public Santa Cruz SB\n` +
          `ordinance/resolution pages. It uses no authentication and performs only normal\n` +
          `pagination/filter actions visible on the public page.\n\n` +
          `Options:\n` +
          `  --output <path>   Output JSON. Default: ${DEFAULT_OUTPUT}\n`
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return { output };
}

function sanitizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  for (const key of [...url.searchParams.keys()]) {
    if (/^(?:_token|token|csrf|authorization|session|signature|secret)$/i.test(key)) {
      url.searchParams.set(key, '<redacted>');
    }
  }
  // DataTables adds a cache-buster that is irrelevant to transport semantics.
  url.searchParams.delete('_');
  return url.toString();
}

async function resetFilters(page: Page) {
  for (const selector of [
    'input[name="numberFilter"]',
    'input[name="titleFilter"]',
    'input[name="from_date"]',
    'input[name="to_date"]',
  ]) {
    const locator = page.locator(selector);
    if ((await locator.count()) > 0) await locator.first().fill('');
  }

  for (const selector of [
    'select[name="tagFilter"]',
    'select[name="authorFilter"]',
    'select[name="coauthorFilter"]',
  ]) {
    const locator = page.locator(selector);
    if ((await locator.count()) > 0) {
      const firstValue = await locator.first().locator('option').first().getAttribute('value');
      await locator.first().selectOption(firstValue ?? '');
    }
  }

  await page.waitForTimeout(WAIT_MS);
}

async function runProbe(
  page: Page,
  probe: ProbeName,
  interaction: string,
  action: () => Promise<boolean>,
  observations: NetworkObservation[]
): Promise<ProbeResult> {
  const startIndex = observations.length;
  try {
    const attempted = await action();
    await page.waitForTimeout(WAIT_MS);
    return {
      probe,
      attempted,
      interaction,
      error: null,
      xhr: observations.slice(startIndex).filter(item => item.probe === probe),
    };
  } catch (error) {
    return {
      probe,
      attempted: true,
      interaction,
      error: error instanceof Error ? error.message : String(error),
      xhr: observations.slice(startIndex).filter(item => item.probe === probe),
    };
  }
}

async function characterize(page: Page, target: (typeof TARGETS)[number]) {
  let activeProbe: ProbeName = 'initial-load';
  const observations: NetworkObservation[] = [];

  const onResponse = (response: Response) => {
    const request = response.request();
    if (!['xhr', 'fetch'].includes(request.resourceType())) return;

    let url: URL;
    try {
      url = new URL(response.url());
    } catch {
      return;
    }
    if (url.hostname !== ALLOWED_HOST) return;

    observations.push({
      probe: activeProbe,
      url: sanitizeUrl(response.url()),
      method: request.method(),
      status: response.status(),
      contentType: response.headers()['content-type'] ?? null,
    });
  };

  page.on('response', onResponse);
  const navigation = await page.goto(target.url, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  await page.waitForTimeout(WAIT_MS);

  const probes: ProbeResult[] = [
    {
      probe: 'initial-load',
      attempted: true,
      interaction: 'normal unauthenticated page load',
      error: null,
      xhr: observations.filter(item => item.probe === 'initial-load'),
    },
  ];

  activeProbe = 'next-page';
  probes.push(
    await runProbe(
      page,
      activeProbe,
      'activate the visible DataTables Next pagination control once',
      async () => {
        const next = page.locator(
          '.dataTables_paginate .paginate_button.next:not(.disabled), a.paginate_button.next:not(.disabled)'
        );
        if ((await next.count()) === 0) return false;
        await next.first().click();
        return true;
      },
      observations
    )
  );

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(WAIT_MS);
  activeProbe = 'date-filter-2024';
  probes.push(
    await runProbe(
      page,
      activeProbe,
      'set the public from_date/to_date controls to 2024-01-01 / 2024-12-31 and dispatch change',
      async () => {
        const from = page.locator('input[name="from_date"]');
        const to = page.locator('input[name="to_date"]');
        if ((await from.count()) === 0 || (await to.count()) === 0) return false;
        await from.first().fill('2024-01-01');
        await to.first().fill('2024-12-31');
        await to.first().dispatchEvent('change');
        return true;
      },
      observations
    )
  );

  await resetFilters(page);
  activeProbe = 'title-filter';
  probes.push(
    await runProbe(
      page,
      activeProbe,
      'enter SANTA CRUZ in the public titleFilter control and dispatch input/change',
      async () => {
        const title = page.locator('input[name="titleFilter"]');
        if ((await title.count()) === 0) return false;
        await title.first().fill('SANTA CRUZ');
        await title.first().dispatchEvent('input');
        await title.first().dispatchEvent('change');
        return true;
      },
      observations
    )
  );

  await resetFilters(page);
  activeProbe = 'tag-filter';
  probes.push(
    await runProbe(
      page,
      activeProbe,
      'select the first non-empty public tagFilter option and dispatch change',
      async () => {
        const tag = page.locator('select[name="tagFilter"]');
        if ((await tag.count()) === 0) return false;
        const options = tag.first().locator('option');
        const count = await options.count();
        for (let index = 0; index < count; index += 1) {
          const value = (await options.nth(index).getAttribute('value')) ?? '';
          if (!value) continue;
          await tag.first().selectOption(value);
          await tag.first().dispatchEvent('change');
          return true;
        }
        return false;
      },
      observations
    )
  );

  page.off('response', onResponse);
  return {
    key: target.key,
    pageUrl: target.url,
    navigationStatus: navigation?.status() ?? null,
    finalUrl: page.url(),
    probes,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const targets = [];

  try {
    for (const target of TARGETS) {
      const page = await context.newPage();
      targets.push(await characterize(page, target));
      await page.close();
      await new Promise(resolve => setTimeout(resolve, WAIT_MS));
    }
  } finally {
    await context.close();
    await browser.close();
  }

  const output = {
    schemaVersion: 1,
    characterizedAt: new Date().toISOString(),
    method: 'normal-unauthenticated-playwright-public-interaction-probe',
    authenticationUsed: false,
    interactionsLimitedToPublicControls: true,
    minimumInterProbeDelayMs: WAIT_MS,
    targets,
  };

  const resolved = path.resolve(args.output);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
