// playwright.config.js
// Run with: npx playwright test
// Make sure the dev server is running first: npm run dev

import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.development.local') })

export default defineConfig({
  // All tests live in e2e/
  testDir: './e2e',

  // Give each test a generous timeout — the app fetches real data
  timeout: 30_000,

  // Run tests sequentially (one at a time) so they don't stomp each other
  workers: 1,

  use: {
    // The Vite dev server
    baseURL: 'http://localhost:5173',

    // Record a video on failure so you can see what went wrong
    video: 'on-first-retry',

    // Take a screenshot on failure
    screenshot: 'only-on-failure',

    // Slow things down slightly so Playwright behaves more like a real user
    // and so async UI updates have time to settle
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Optional: spin up the dev server automatically before running tests.
  // Comment this out if you prefer to start the server yourself.
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: true,
  // },
})