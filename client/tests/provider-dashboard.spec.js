import { test, expect } from '@playwright/test';

test('provider can create a new listing and see it on the dashboard', async ({ page }) => {

  let created = false;
  await page.route('**/api/dashboard/listings', route => {
    if (route.request().method() === 'POST') {
      created = true;
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '999', name: 'Eyebrow Threading', category: 'Beauty',
          location: 'Royce Hall', description: 'Professional eyebrow threading.',
          price: 40, duration: 45, available_dates: [], photos: [],
        }),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          created ? [{
            id: '999', name: 'Eyebrow Threading', category: 'Beauty',
            location: 'Royce Hall', description: 'Professional eyebrow threading.',
            price: 40, duration: 45, available_dates: [], photos: [],
          }] : []
        ),
      });
    }
  });
  await page.route('**/api/bookings**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );

  await page.goto('http://localhost:5173/dashboard');
  await expect(page.getByRole('heading', { name: /my listings/i })).toBeVisible();

  await page.getByRole('button', { name: /new listing/i }).click();
  await expect(page.getByRole('heading', { name: /new listing/i })).toBeVisible();

  await page.getByLabel(/title/i).fill('Eyebrow Threading');
  await page.getByLabel(/category/i).selectOption('Beauty');
  await page.getByLabel(/location/i).fill('Royce Hall');
  await page.getByLabel(/description/i).fill('Professional eyebrow threading.');
  await page.getByLabel(/price/i).fill('40');
  await page.getByLabel(/duration/i).fill('45');

  await page.getByRole('button', { name: /create listing/i }).evaluate(btn => btn.click());

  await expect(page.getByRole('heading', { name: 'Eyebrow Threading' })).toBeVisible();
  await expect(page.getByText(/\$40/)).toBeVisible();
  await expect(page.getByText(/45 min/)).toBeVisible();
});
