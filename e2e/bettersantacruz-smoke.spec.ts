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
    await expect(
      page.getByRole('link', { name: 'Source ledger' }).first()
    ).toHaveAttribute('href', '/sources');
    await expect(page.locator('body')).not.toContainText(/Los Baños|BetterLB/i);
  });

  test('source ledger renders Santa Cruz records by default and supports context filtering', async ({
    page,
  }) => {
    await page.goto('/sources');
    await expect(page.locator('h1').first()).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Source ledger' })
    ).toBeVisible();
    await expect(page.getByText(/source records shown/i)).toContainText('18');
    await expect(page.getByText(/Evidence before publication/i)).toBeVisible();

    await page.selectOption('#source-scope', 'Pagsanjan');
    await expect(page.getByText(/source records shown/i)).toContainText('7');
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

  test('the verified population snapshot is visible while unsupported statistics stay gated', async ({
    page,
  }) => {
    await page.goto('/statistics');
    await expect(
      page.getByRole('heading', { name: 'Population Profile' })
    ).toBeVisible();
    await expect(page.getByText('126,844')).toBeVisible();
    await expect(page.getByText('Growth rate not available')).toBeVisible();
    await expect(
      page.getByRole('note', { name: 'Source attribution' })
    ).toBeVisible();

    await page.goto('/statistics/municipal-income');
    await expect(page.getByRole('status')).toContainText(/municipal income/i);
  });

  test('home does not request disabled live feeds', async ({ page }) => {
    const externalRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (/openweathermap|bettergov\.ph\/forex|losbanos\.gov\.ph/i.test(url)) {
        externalRequests.push(url);
      }
    });

    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(externalRequests).toEqual([]);
  });

  test('home, sources, and services pass an axe smoke scan', async ({
    page,
  }) => {
    for (const route of ['/', '/sources', '/services']) {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, `${route} accessibility violations`).toEqual(
        []
      );
    }
  });
});
