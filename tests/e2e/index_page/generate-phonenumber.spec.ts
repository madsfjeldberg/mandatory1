import { test, expect } from '@playwright/test';

test('phone number is randomly generated for partial generation', async ({ page }) => {
  await page.goto('');

  // Select partial generation and choose "Phone number"
  await page.getByRole('radio', { name: 'Partial generation:' }).check();
  await page.locator('#cmbPartialOptions').selectOption('phone');
  await page.getByRole('button', { name: 'Generate' }).click();

  const card = page.locator('article.personCard');

  // Check labels voisibility
  await expect(card.getByText('CPR:')).not.toBeVisible();
  await expect(card.getByText('First name:')).not.toBeVisible();
  await expect(card.getByText('Last name:')).not.toBeVisible();
  await expect(card.getByText('Gender:')).not.toBeVisible();
  await expect(card.getByText('Date of birth:')).not.toBeVisible();
  await expect(card.getByText('Address:')).not.toBeVisible();
  await expect(card.getByText(/Phone.*number/i)).toBeVisible();

  // Check values are not empty
  await expect(card.locator('.cprValue')).toBeEmpty();
  await expect(card.locator('.firstNameValue')).toBeEmpty();
  await expect(card.locator('.lastNameValue')).toBeEmpty();
  await expect(card.locator('.genderValue')).toBeEmpty();
  await expect(card.locator('.dobValue')).toBeEmpty();
  await expect(card.locator('.streetValue')).toBeEmpty();
  await expect(card.locator('.townValue')).toBeEmpty();
  await expect(card.locator('.phoneNumberValue')).not.toBeEmpty();
});
