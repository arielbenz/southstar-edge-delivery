import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = `file://${path.resolve(__dirname, '../fixtures/mock-blocks.html')}`;

// Selector helpers
const ITEM = '.cmp-accordion__item';
const DETAILS = (n) => `.cmp-accordion__item:nth-child(${n}) details`;
const SHOW_ALL = '.cmp-accordion__action--show';
const HIDE_ALL = '.cmp-accordion__action--hide';

test.describe('Accordion block', () => {
  test.beforeEach(async ({ page }) => {
    // The fixture contains the raw HTML structure of the accordion block without JS (only HTML/CSS)
    // For the test, we use the fixture URL directly WITHOUT JS (only HTML/CSS)
    // If tests with JS were needed, the file would need to be served with a server
    await page.goto(FIXTURE);
  });

  test('should contain accordion items in the fixture', async ({ page }) => {
    // The fixture contains the <div class="accordion block"> structure without decoration
    const accordion = page.locator('.accordion.block');
    await expect(accordion).toBeVisible();
    // There should be 3 content items (excluding the heading row)
    const items = accordion.locator(':scope > div');
    await expect(items).toHaveCount(4); // 1 heading + 3 items
  });

  test('the frequently asked questions section is present', async ({
    page,
  }) => {
    const accordion = page.locator('.accordion.block');
    await expect(accordion).toContainText('Frequently Asked Questions');
  });

  test('all three items have content', async ({ page }) => {
    const accordion = page.locator('.accordion.block');
    await expect(accordion).toContainText(
      'How do I switch to Ohio Natural Gas?',
    );
    await expect(accordion).toContainText('What is a fixed-rate plan?');
    await expect(accordion).toContainText('Is there an early termination fee?');
  });

  test('the content of the first item is present in the fixture', async ({
    page,
  }) => {
    await expect(page.locator('.accordion.block')).toContainText(
      'Switching is easy',
    );
  });
});
