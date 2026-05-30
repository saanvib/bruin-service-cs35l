import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { sql } from '../db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '..', 'migrations')

const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

for (const file of files) {
  console.log(`Running ${file}...`)
  const text = readFileSync(join(migrationsDir, file), 'utf8')
  const statements = text
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
  for (const stmt of statements) {
    await sql.query(stmt)
  }
}

console.log('Migrations complete.')
