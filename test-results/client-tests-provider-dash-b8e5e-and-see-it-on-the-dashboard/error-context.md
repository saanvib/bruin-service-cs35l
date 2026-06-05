# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: client/tests/provider-dashboard.spec.js >> provider can create a new listing and see it on the dashboard
- Location: client/tests/provider-dashboard.spec.js:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /my listings/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /my listings/i })

```

```yaml
- navigation:
  - link "BruinServices":
    - /url: /
    - heading "BruinServices" [level=1]
  - link "Home":
    - /url: /
  - link "Chat":
    - /url: /chat
  - link "Login":
    - /url: /login
- text: Welcome!
- paragraph: Welcome!
- textbox:
  - /placeholder: Email address *
- text: By continuing, I agree to the Company's
- paragraph: By continuing, I agree to the Company's
- link "Privacy Statement":
  - /url: ""
- text: and
- paragraph: and
- link "Terms of Service":
  - /url: ""
- button "Continue":
  - button "Continue"
- text: OR
- button "Continue with Google":
  - button "Continue with Google":
    - img
    - text: Continue with Google
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('provider can create a new listing and see it on the dashboard', async ({ page }) => {
  4  | 
  5  |   let created = false;
  6  |   await page.route('**/api/dashboard/listings', route => {
  7  |     if (route.request().method() === 'POST') {
  8  |       created = true;
  9  |       route.fulfill({
  10 |         status: 201,
  11 |         contentType: 'application/json',
  12 |         body: JSON.stringify({
  13 |           id: '999', name: 'Eyebrow Threading', category: 'Beauty',
  14 |           location: 'Royce Hall', description: 'Professional eyebrow threading.',
  15 |           price: 40, duration: 45, available_dates: [], photos: [],
  16 |         }),
  17 |       });
  18 |     } else {
  19 |       route.fulfill({
  20 |         status: 200,
  21 |         contentType: 'application/json',
  22 |         body: JSON.stringify(
  23 |           created ? [{
  24 |             id: '999', name: 'Eyebrow Threading', category: 'Beauty',
  25 |             location: 'Royce Hall', description: 'Professional eyebrow threading.',
  26 |             price: 40, duration: 45, available_dates: [], photos: [],
  27 |           }] : []
  28 |         ),
  29 |       });
  30 |     }
  31 |   });
  32 |   await page.route('**/api/bookings**', route =>
  33 |     route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  34 |   );
  35 | 
  36 |   await page.goto('http://localhost:5173/dashboard');
> 37 |   await expect(page.getByRole('heading', { name: /my listings/i })).toBeVisible();
     |                                                                     ^ Error: expect(locator).toBeVisible() failed
  38 | 
  39 |   await page.getByRole('button', { name: /new listing/i }).click();
  40 |   await expect(page.getByRole('heading', { name: /new listing/i })).toBeVisible();
  41 | 
  42 |   await page.getByLabel(/title/i).fill('Eyebrow Threading');
  43 |   await page.getByLabel(/category/i).selectOption('Beauty');
  44 |   await page.getByLabel(/location/i).fill('Royce Hall');
  45 |   await page.getByLabel(/description/i).fill('Professional eyebrow threading.');
  46 |   await page.getByLabel(/price/i).fill('40');
  47 |   await page.getByLabel(/duration/i).fill('45');
  48 | 
  49 |   await page.getByRole('button', { name: /create listing/i }).evaluate(btn => btn.click());
  50 | 
  51 |   await expect(page.getByRole('heading', { name: 'Eyebrow Threading' })).toBeVisible();
  52 |   await expect(page.getByText(/\$40/)).toBeVisible();
  53 |   await expect(page.getByText(/45 min/)).toBeVisible();
  54 | });
  55 | 
```