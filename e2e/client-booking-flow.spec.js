// e2e/client-booking-flow.spec.js

import { test, expect } from '@playwright/test'
import DescopeClient from '@descope/node-sdk'

// ─── Descope Setup ──────────────────────────────────────────────────────────
// Pull your keys from the environment. The Management Key is required to 
// generate OTPs for test users dynamically.
const projectId = process.env.VITE_DESCOPE_PROJECT_ID || process.env.DESCOPE_PROJECT_ID;
const managementKey = process.env.DESCOPE_MANAGEMENT_KEY;

// Follows the dynamic test user regex specified in your Descope Console
const TEST_EMAIL = `student+testBruin_${Date.now()}@example.com`;

// ─── Fixtures ───────────────────────────────────────────────────────────────
const FAKE_LISTING = {
  id: '42',
  name: 'Curly Hair Cut',
  description: 'A relaxing haircut tailored for curly hair. Includes wash and style.',
  category: 'Haircut',
  price: 25,
  duration: 60,
  rating: 4.5,
  photos: [],
  availableDates: [],
}

const FAKE_BOOKING = {
  id: 'booking-777',
  listingId: '42',
  listingName: 'Curly Hair Cut',
  date: '', 
  time: '10:00',
  customerName: 'Test Bruin',
  customerEmail: TEST_EMAIL,
  status: 'confirmed',
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function futureDateString(daysAhead = 7) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Intercept all BruinServices backend API calls.
 * We retain this to prevent database pollution and state flakiness.
 */
async function mockBackendApi(page, bookingDate) {
  const filledBooking = { ...FAKE_BOOKING, date: bookingDate }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // GET /api/listings
  await page.route('**/api/listings**', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers: corsHeaders })
    await route.fulfill({
      status: 200, contentType: 'application/json', headers: corsHeaders,
      body: JSON.stringify([{ ...FAKE_LISTING, availableDates: [`${bookingDate}T10:00`] }]),
    })
  })

  // GET /api/listings/42
  await page.route('**/api/listings/42**', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers: corsHeaders })
    await route.fulfill({
      status: 200, contentType: 'application/json', headers: corsHeaders,
      body: JSON.stringify({ ...FAKE_LISTING, availableDates: [`${bookingDate}T10:00`] }),
    })
  })

  // GET /api/bookings/mine
  let myBookings = []
  await page.route('**/api/bookings/mine**', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers: corsHeaders })
    await route.fulfill({
      status: 200, contentType: 'application/json', headers: corsHeaders,
      body: JSON.stringify(myBookings),
    })
  })

  // GET /api/bookings/slots/42
  await page.route('**/api/bookings/slots/42**', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers: corsHeaders })
    await route.fulfill({
      status: 200, contentType: 'application/json', headers: corsHeaders, body: JSON.stringify([]),
    })
  })

  // POST /api/bookings
  await page.route('**/api/bookings', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers: corsHeaders })
    if (route.request().method() === 'POST') {
      myBookings = [filledBooking]
      await route.fulfill({
        status: 201, contentType: 'application/json', headers: corsHeaders,
        body: JSON.stringify(filledBooking),
      })
    } else {
      await route.continue()
    }
  })

  // GET /api/providers/:id
  await page.route('**/api/providers/**', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers: corsHeaders })
    await route.fulfill({
      status: 200, contentType: 'application/json', headers: corsHeaders,
      body: JSON.stringify({ id: 'prov-1', name: 'Test Provider', bio: '' }),
    })
  })
}

// ─── Test ───────────────────────────────────────────────────────────────────

test.describe('Client booking flow', () => {
  const BOOKING_DATE = futureDateString(7)
  let descopeClient;

  test.beforeAll(() => {
    // Initialize the official Descope Node SDK
    descopeClient = DescopeClient({ projectId, managementKey });
  });

  test.beforeEach(async ({ page }) => {
    // We strictly mock the backend database interactions. 
    // Descope API traffic passes through normally!
    await mockBackendApi(page, BOOKING_DATE)
  })

  test.afterAll(async () => {
    // Clean up dynamic test user so we don't hit the Descope console limit
    try {
       await descopeClient.management.user.delete(TEST_EMAIL);
    } catch(e) { /* Ignore if it fails */ }
  });

  test('student logs in via real Descope UI, browses, and books an appointment', async ({ page }) => {
    // ── STEP 1: Authentic UI Login ──────────────────────────────────────
    await page.goto('/')

    // RequireAuth redirects to login
    await expect(page).toHaveURL(/\/login/)

    // Enter the dynamic test email
    await page.locator('input[name="email"]').fill(TEST_EMAIL)
    await page.locator('descope-button[data-type="button"]').click()

    // Query Descope's Management API to generate the OTP for this test user dynamically
    const otpResp = await descopeClient.management.user.generateOtpForTestUser('email', TEST_EMAIL);
    const otpCode = otpResp.data.code;

    // Type the generated OTP directly into the UI
    await page.keyboard.type(otpCode);
    
    // Fallback: If Descope doesn't auto-submit, click submit
    const submitBtn = page.getByRole('button', { name: 'Submit' });
    if (await submitBtn.isVisible()) {
        await submitBtn.click();
    }

    // Await redirect back to the app
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByText(/UCLA Student Services/i)).toBeVisible()

    // ── STEP 2: Navigate to Browse ───────────────────────────────────────
    await page.getByRole('link', { name: 'Browse' }).click()
    await expect(page).toHaveURL(/\/browse/)
    await expect(page.getByText('Browse Services')).toBeVisible()

    // ── STEP 3: See the listing in the feed ─────────────────────────────
    await expect(page.getByText('Curly Hair Cut')).toBeVisible()
    await expect(page.getByText('$25')).toBeVisible()
    await expect(page.getByText('Haircut')).toBeVisible()

    // ── STEP 4: Click "Book Now" on that listing ─────────────────────────
    await page.getByRole('link', { name: 'Book Now' }).first().click()
    await expect(page).toHaveURL(/\/bookings\/42/)
    await expect(page.getByText('Curly Hair Cut')).toBeVisible()

    // ── STEP 5: Pick a date from the calendar ───────────────────────────
    const dayNumber = String(parseInt(BOOKING_DATE.split('-')[2], 10))
    const calendarDay = page.locator('.calendar-day').filter({ hasText: dayNumber }).first()
    await calendarDay.click()
    await expect(page.getByRole('combobox')).toBeVisible()

    // ── STEP 6: Pick a time slot ─────────────────────────────────────────
    await page.getByRole('combobox').selectOption({ label: /10:00 AM/ })

    // ── STEP 7: Submit the booking ───────────────────────────────────────
    await page.getByRole('button', { name: 'Confirm Booking' }).click()

    // ── STEP 8: Assert the confirmation receipt ───────────────────────────
    await expect(page.getByText('Booking Confirmed!')).toBeVisible()
    await expect(page.getByText('booking-777', { exact: false })).toBeVisible()

    // ── STEP 9: Verify booking appears in "My Bookings" ──────────────────
    await page.getByRole('link', { name: /home|bruin/i }).first().click()
    if (!page.url().includes('localhost:5173/') || page.url().includes('/bookings')) {
      await page.goto('/')
    }
    await expect(page.getByText('My Bookings')).toBeVisible()
    await expect(page.getByText('Curly Hair Cut')).toBeVisible()
  })

  // ── Bonus: unauthenticated user is redirected to login ──────────────────
  test('unauthenticated user is redirected to the login page', async ({ page }) => {
    // Wipe cookies and storage
    await page.context().clearCookies();
    await page.addInitScript(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()
    })

    await page.goto('/browse')
    await expect(page).toHaveURL(/\/login/)
  })
})