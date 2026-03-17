import { test, expect } from '@playwright/test';

test('name, gender and cpr are randomly generated for partial generation', async ({ page }) => {
  await page.goto('');

  // Select partial generation and choose "Name, Gender and cpr"
  await page.getByRole('radio', { name: 'Partial generation:' }).check();
  await page.locator('#cmbPartialOptions').selectOption('cpr-name-gender');
  await page.getByRole('button', { name: 'Generate' }).click();

  const card = page.locator('article.personCard');

  // Check labels visibility
  await expect(card.getByText('CPR:')).toBeVisible();
  await expect(card.getByText('First name:')).toBeVisible();
  await expect(card.getByText('Last name:')).toBeVisible();
  await expect(card.getByText('Gender:')).toBeVisible();
  await expect(card.getByText('Date of birth:')).not.toBeVisible();
  await expect(card.getByText('Address:')).not.toBeVisible();
  await expect(card.getByText(/Phone.*number/i)).not.toBeVisible();

  // Check values are not empty
  await expect(card.locator('.cprValue')).not.toBeEmpty();
  await expect(card.locator('.firstNameValue')).not.toBeEmpty();
  await expect(card.locator('.lastNameValue')).not.toBeEmpty();
  await expect(card.locator('.genderValue')).not.toBeEmpty();
  await expect(card.locator('.dobValue')).toBeEmpty();
  await expect(card.locator('.streetValue')).toBeEmpty();
  await expect(card.locator('.townValue')).toBeEmpty();
  await expect(card.locator('.phoneNumberValue')).toBeEmpty();
});
