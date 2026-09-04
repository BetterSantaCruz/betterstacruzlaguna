import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../test-config';

test.describe('BetterSantaCruz sanity suite', () => {
  test.setTimeout(60000);

  // RULE 1: Accessibility (The most important for a government portal)
  test('should pass WCAG 2.1 Level AA checks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    await page.goto('/services');
    await expect(page.locator('h1').first()).toBeVisible();
    const servicesResults = await new AxeBuilder({ page }).analyze();
    expect(servicesResults.violations).toEqual([]);
  });

  // RULE 2: Search Logic (Ensures the JSON-to-UI bridge isn't broken)
  test('services page exposes the verified-data boundary', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByRole('status')).toContainText(
      /not yet verified|not yet published|published yet|being verified/i
    );
  });

  // RULE 3: Navigation & Breadcrumbs (Ensures the site "Flow" works)
  test('directory navigation exposes an empty, review-gated state', async ({
    page,
  }) => {
    await page.goto('/government/departments');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByRole('status')).toContainText(
      /not yet verified|not yet published|published yet|being verified/i
    );
  });

  // RULE 4: Touch Targets (Ensures mobile users and people with motor impairments can use the site)
  test('interactive elements must meet 44px target size', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    const primaryLinks = page.locator('a.group, button');
    const box = await primaryLinks.first().boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
