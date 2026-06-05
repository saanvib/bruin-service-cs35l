import Descope from '@descope/node-sdk'
import { chromium } from '@playwright/test'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve('../.env') })

export const authFile = 'tests/auth/user.json'

export default async function globalSetup() {
  const testUser = crypto.randomBytes(20).toString('hex')
  process.env.TEST_USER = testUser

  const descope = Descope({
    projectId: process.env.VITE_DESCOPE_PROJECT_ID,
    managementKey: process.env.DESCOPE_MANAGEMENT_KEY,
  })

  await descope.management.user.createTestUser(testUser, 'test@test.test')
  await descope.management.user.setRoles(testUser, ['provider'])

  const magiclink = await descope.management.user.generateMagicLinkForTestUser(
    'email',
    testUser,
    'https://test.local'
  )

  const token = magiclink.data.link.split('?t=')[1]
  const auth = await descope.magicLink.verify(token)

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('http://localhost:5173')

  await page.evaluate(
    ([ds, dsr, dsli]) => {
      window.localStorage.setItem('DS', ds)
      window.localStorage.setItem('DSR', dsr)
      window.localStorage.setItem('DSLI', dsli)
    },
    [auth.data.sessionJwt, auth.data?.refreshJwt, String(Math.floor(Date.now() / 1000) + 3600)]
  )

  await page.reload()
await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 })
  fs.mkdirSync('tests/auth', { recursive: true })
  await page.context().storageState({ path: authFile })
  await browser.close()
}
