import Descope from '@descope/node-sdk'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve('../.env') })

export default async function globalTeardown() {
  const descope = Descope({
    projectId: process.env.VITE_DESCOPE_PROJECT_ID,
    managementKey: process.env.DESCOPE_MANAGEMENT_KEY,
  })
  if (process.env.PLAYWRIGHT_TEST_USER) {
    await descope.management.user.delete(process.env.PLAYWRIGHT_TEST_USER)
  }
}
