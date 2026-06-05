//client test

import { test, expect } from '@playwright/test';

// Pre-built customer JWT — RequireAuth + RequireRole both short-circuit
// in VITE_TEST_MODE so no real Descope session is needed.
const CUSTOMER_DS =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNLM0VLQW9JTUdYc3lCQUl0VkdIdTc1d1F5YXlGIiwidHlwIjoiSldUIn0' +
  '.eyJhbXIiOlsiZW1haWwiXSwiYXVkIjpbIlAzRUtBb0hLWXppVHVNdDVyeGx5MUhaelRZdVgiXSwiZHJuIjoiRFMiLCJlbWFpbCI6InRlc3RAdGVzdC50ZXN0IiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE3ODA2NDI4OTYsImlzcyI6Imh0dHBzOi8vYXBpLmRlc2NvcGUuY29tL3YxL2FwcHMvUDNFS0FvSEtZemlUdU10NXJ4bHkxSFp6VFl1WCIsInJleHAiOiIyMDk5LTAxLTAxVDAwOjAwOjAwWiIsInJvbGVzIjpbImN1c3RvbWVyIl0sInN1YiI6IlUzRWh1MDB4NlNTdTVQeU5xQUdhc2VzbHVUNkIiLCJ0dSI6dHJ1ZX0' +
  '.placeholder_sig_not_verified_in_test_mode';

const CUSTOMER_DSR =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6IlNLM0VLQW9JTUdYc3lCQUl0VkdIdTc1d1F5YXlGIiwidHlwIjoiSldUIn0' +
  '.eyJhbXIiOlsiZW1haWwiXSwiYXVkIjpbIlAzRUtBb0hLWXppVHVNdDVyeGx5MUhaelRZdVgiXSwiZHJuIjoiRFNSIiwiZW1haWwiOiJ0ZXN0QHRlc3QudGVzdCIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNzgwNjQyODk2LCJpc3MiOiJodHRwczovL2FwaS5kZXNjb3BlLmNvbS92MS9hcHBzL1AzRUtBb0hLWXppVHVNdDVyeGx5MUhaelRZdVgiLCJzdWIiOiJVM0VodTAweDZTU3U1UHlOcUFHYXNlc2x1VDZCIiwidHUiOnRydWV9' +
  '.placeholder_sig_not_verified_in_test_mode';

const CUSTOMER_DSLI = String(Math.floor(Date.now() / 1000) + 86400 * 30);

const MOCK_LISTING = {
  id: '42',
  name: 'Gel Manicure',
  category: 'Nails',
  location: 'Ackerman Union',
  description: 'Long-lasting gel polish, cuticle care included.',
  price: 35,
  duration: 60,
  rating: 4.8,
  photos: [],
  services: [{ name: 'Gel Polish', price: 35 }],
  availableDates: [],
};

test('client can browse listings, view a listing, and submit a review', async ({ page }) => {

  // ── 1. Inject auth tokens before the page loads ──
  // addInitScript runs before React mounts, so Descope sees the session immediately.
  await page.addInitScript(([ds, dsr, dsli]) => {
    window.localStorage.setItem('DS', ds);
    window.localStorage.setItem('DSR', dsr);
    window.localStorage.setItem('DSLI', dsli);
  }, [CUSTOMER_DS, CUSTOMER_DSR, CUSTOMER_DSLI]);

  // ── 2. Mock API routes ──

  // GET /api/listings — browse page feed
  await page.route('**/api/listings**', route => {
    // Let the more specific /listings/42 handler below take those requests
    if (route.request().url().match(/\/listings\/\d+/)) return route.fallback();
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MOCK_LISTING]) });
  });

  // GET /api/listings/42 — listing detail page
  await page.route('**/api/listings/42**', route => {
    // Don't intercept the reviews sub-route here
    if (route.request().url().includes('/reviews')) return route.fallback();
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_LISTING) });
  });

  // GET /api/listings/42/reviews — initially no reviews
  // POST /api/listings/42/reviews — review submission
  await page.route('**/api/listings/42/reviews**', route => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: '1', rating: 4, comment: 'Great service, very professional!', created_at: new Date().toISOString() }),
      });
    }
    // GET — return empty list so "No reviews yet" shows and the form is rendered
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  // GET /api/bookings/mine — browse page badge check (not core to this test)
  await page.route('**/api/bookings/mine**', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  // ── 3. Browse page — verify the listing card is visible ──
  await page.goto('http://localhost:5173/browse');
  await expect(page.getByRole('heading', { name: /browse services/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gel Manicure' })).toBeVisible();
  await expect(page.getByText(/\$35/)).toBeVisible();

  // ── 4. Click "View Details" to go to the listing detail page ──
  await page.getByRole('link', { name: /view details/i }).click();

  // ── 5. Verify listing detail page rendered correctly ──
  await expect(page.getByRole('heading', { name: 'Gel Manicure' })).toBeVisible();
  await expect(page.getByText('Ackerman Union')).toBeVisible();
  await expect(page.getByText(/no reviews yet/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /leave a review/i })).toBeVisible();

  // ── 6. Select a star rating (4 stars) ──
  const ratingSelect = page.locator('label', { hasText: /rating/i }).locator('select');
  await ratingSelect.waitFor({ state: 'visible' });
  await ratingSelect.selectOption('4');

  // ── 7. Write a comment ──
  const commentBox = page.locator('textarea');
  await commentBox.fill('Great service, very professional!');

  // ── 8. Submit the review ──
  await page.getByRole('button', { name: /submit review/i }).click();

  // ── 9. Verify success message ──
  await expect(page.getByText(/review submitted/i)).toBeVisible();
});