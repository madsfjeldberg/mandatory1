import { test, expect } from '@playwright/test';

test('generated a single person which shows all fields with non-empty values', async ({ page }) => {
  await page.goto('');

  // use the default generation option (which should be "Complete generation") and click generate
  await page.getByRole('button', { name: 'Generate' }).click();

  const card = page.locator('article.personCard');
  await expect(card).toBeVisible();

  // Check label visibility
  await expect(card.getByText('CPR:')).toBeVisible();
  await expect(card.getByText('First name:')).toBeVisible();
  await expect(card.getByText('Last name:')).toBeVisible();
  await expect(card.getByText('Gender:')).toBeVisible();
  await expect(card.getByText('Date of birth:')).toBeVisible();
  await expect(card.getByText('Address:')).toBeVisible();
  await expect(card.getByText(/Phone.*number/i)).toBeVisible();

  // Check values are not empty
  await expect(card.locator('.cprValue')).not.toBeEmpty();
  await expect(card.locator('.firstNameValue')).not.toBeEmpty();
  await expect(card.locator('.lastNameValue')).not.toBeEmpty();
  await expect(card.locator('.genderValue')).not.toBeEmpty();
  await expect(card.locator('.dobValue')).not.toBeEmpty();
  await expect(card.locator('.streetValue')).not.toBeEmpty();
  await expect(card.locator('.townValue')).not.toBeEmpty();
  await expect(card.locator('.phoneNumberValue')).not.toBeEmpty();
});
