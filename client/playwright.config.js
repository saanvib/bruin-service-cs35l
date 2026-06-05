import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'VITE_TEST_MODE=true npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
  },
})
