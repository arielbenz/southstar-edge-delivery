import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = `file://${path.resolve(__dirname, '../fixtures/mock-blocks.html')}`;

test.describe('Plans block fixture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FIXTURE);
  });

  test('the fixture contains the plans block', async ({ page }) => {
    const plansBlock = page.locator('.plans.block');
    await expect(plansBlock).toBeVisible();
  });

  test('the fixture contains the three plans', async ({ page }) => {
    const plansBlock = page.locator('.plans.block');
    await expect(plansBlock).toContainText('Fixed Rate 12-Month');
    await expect(plansBlock).toContainText('Fixed Rate 24-Month');
    await expect(plansBlock).toContainText('Variable Rate Monthly');
  });

  test('the featured plan is marked correctly', async ({ page }) => {
    const plansBlock = page.locator('.plans.block');
    // The Fixed Rate 24-Month plan has featured: true
    await expect(plansBlock).toContainText('Fixed Rate 24-Month');

    // Verify that the featured plan row contains "true"
    const rows = plansBlock.locator(':scope > div');
    const rowTexts = await rows.allTextContents();
    const featuredRow = rowTexts.find((t) => t.includes('true'));
    expect(featuredRow).toBeTruthy();
  });

  test('the plans contain rate data', async ({ page }) => {
    const plansBlock = page.locator('.plans.block');
    await expect(plansBlock).toContainText('52.9');
    await expect(plansBlock).toContainText('54.5');
    await expect(plansBlock).toContainText('49.1');
  });

  test('the plans contain term duration', async ({ page }) => {
    const plansBlock = page.locator('.plans.block');
    await expect(plansBlock).toContainText('12');
    await expect(plansBlock).toContainText('24');
  });
});
