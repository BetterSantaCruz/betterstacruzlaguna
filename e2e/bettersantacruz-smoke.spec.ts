import AxeBuilder from '@axe-core/playwright';

import { expect, test } from './test-config';

test.describe('BetterSantaCruz evidence-gated MVP', () => {
  test.setTimeout(60000);

  test('home identifies the independent project and exposes the source ledger', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();

    await expect(page.locator('h1')).toBeVisible();
    await expect(
      page.getByText(/Independent community project/i)
    ).toBeVisible();
    await expect(page.getByText('26 PSA-verified Barangays')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Source ledger' }).first()
    ).toHaveAttribute('href', '/sources');
    await expect(page.locator('body')).not.toContainText(/Los Baños|BetterLB/i);
  });

  test('source ledger renders only Santa Cruz production sources and filters evidence dimensions independently', async ({
    page,
  }) => {
    await page.goto('/sources');
    await expect(page.locator('h1').first()).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Source ledger' })
    ).toBeVisible();
    await expect(page.getByText(/source records shown/i)).toContainText('18');
    await expect(page.getByText(/Evidence before publication/i)).toBeVisible();

    const summary = page.getByRole('region', { name: 'Source review summary' });
    await expect(summary).toContainText('7 reviewed');
    await expect(summary).toContainText('11 needs-review');

    await page.getByLabel('Filter by review state').selectOption('reviewed');
    await expect(page.getByText(/source records shown/i)).toContainText('7');
    await expect(summary).toContainText('7 reviewed');

    await page.getByLabel('Filter by review state').selectOption('all');
    await page
      .getByLabel('Filter by source authority')
      .selectOption('civic-index');
    await expect(page.getByText(/source records shown/i)).toContainText('1');
    await expect(page.getByText('BetterGov.ph')).toBeVisible();

    await page.getByLabel('Filter by source authority').selectOption('all');
    await page
      .getByLabel('Filter by access state')
      .selectOption('partially-rendered');
    await expect(page.getByText(/source records shown/i)).toContainText('4');

    await expect(page.locator('body')).not.toContainText(/Pagsanjan, Laguna/);
    await expect(page.locator('body')).not.toContainText(/Los Baños|BetterLB/i);
  });

  test('unverified civic datasets are explicit empty states', async ({
    page,
  }) => {
    for (const route of ['/services', '/government/departments']) {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.getByRole('status').first()).toBeVisible();
      await expect(page.getByRole('status').first()).toContainText(
        /not yet|not published|published yet|not available|being verified/i
      );
    }
  });

  test('verified baseline records are visible with provenance', async ({
    page,
  }) => {
    await page.goto('/government/barangays');
    await expect(
      page.getByRole('heading', { name: 'Local Barangays' })
    ).toBeVisible();
    await expect(page.getByText('26 component barangays')).toBeVisible();
    await expect(
      page.getByText(
        'Municipality of Santa Cruz — Philippine Standard Geographic Code barangays'
      )
    ).toBeVisible();
    await expect(page.getByText('PSGC 0403426002')).toBeVisible();
    await expect(page.getByText('13,615')).toBeVisible();

    await page.goto('/government');
    await expect(
      page.getByText(/PSA-verified barangay codes, classifications/i)
    ).toBeVisible();

    await page.goto('/government/elected-officials');
    await expect(
      page.getByText('Joseph Kris Benjamin B. Agarao')
    ).toBeVisible();
    await expect(page.getByText('Laarni A. Malibiran')).toBeVisible();
    await expect(
      page.getByText(
        '2026 Philippine Government Directory of Agencies and Officials'
      )
    ).toBeVisible();
    await expect(page.getByRole('status')).toContainText(
      /Sangguniang Bayan roster/i
    );
  });

  test('population statistics expose only the verified snapshot', async ({
    page,
  }) => {
    await page.goto('/statistics/population');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByText('126,844')).toBeVisible();
    await expect(
      page.getByText('2024 POPCEN resident count', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText(/Only the 2024 POPCEN snapshot is currently published/i)
    ).toBeVisible();
  });

  test('gated statistics routes are explicit rather than fabricated', async ({
    page,
  }) => {
    for (const route of [
      '/statistics/municipal-income',
      '/statistics/competitiveness',
    ]) {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.getByRole('status')).toContainText(
        /not yet|not available|being verified/i
      );
    }
  });

  test('source and baseline pages pass critical accessibility checks', async ({
    page,
  }) => {
    for (const route of [
      '/',
      '/sources',
      '/government/elected-officials',
      '/government/barangays',
      '/statistics/population',
    ]) {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    }
  });

  test('crawler note describes the verified baseline without claiming gated datasets', async ({
    request,
  }) => {
    const response = await request.get('/llms.txt');
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toContain('2024 POPCEN population');
    expect(text).toContain('26 barangays');
    expect(text).not.toMatch(/complete current council/i);
    expect(text).not.toMatch(/verified emergency/i);
  });

  test('direct SPA deep links resolve the BetterSantaCruz application', async ({
    page,
  }) => {
    const response = await page.goto('/government/barangays');
    expect(response?.ok()).toBeTruthy();
    await expect(
      page.getByRole('heading', { name: 'Local Barangays' })
    ).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/Los Baños|BetterLB/i);
  });

  test('404 handling does not reuse inherited BetterLB claims', async ({
    page,
  }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/Los Baños|BetterLB/i);
  });

  test('search remains honest when no reviewed service data exists', async ({
    page,
  }) => {
    await page.goto('/search');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/Los Baños|BetterLB/i);
  });
});
