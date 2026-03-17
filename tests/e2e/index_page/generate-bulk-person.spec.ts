import { test, expect } from '@playwright/test';

test('generate bulk persons (100) and verify each <p> in card has content', async ({ page }) => {
  await page.goto('');

  // use default preselected option for bulk generation and generate "100" fake people data
  await page.locator('#txtNumberPersons').click();
  await page.locator('#txtNumberPersons').fill('100');
  await page.getByRole('button', { name: 'Generate' }).click();

  const cards = page.locator('article.personCard');

  expect(await cards.count()).toBeLessThanOrEqual(100);

  // Get all <p> elements inside the card
  const paragraphs = cards.locator('p');

  // Check that each <p> element has non-empty content anti pattern?
  for (const p of await paragraphs.all()) {
    expect(p).not.toBeEmpty();
  }
});
