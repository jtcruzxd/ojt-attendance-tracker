/**
 * Aligns Better Auth tables with the fields required by better-auth@1.6+.
 *
 * Usage: npx tsx scripts/migrate-auth-schema.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Pool } from 'pg'

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

async function main() {
  loadEnvFile(resolve(process.cwd(), '.env.local'))
  loadEnvFile(resolve(process.cwd(), '.env'))

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing')
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await pool.query(`
      ALTER TABLE "session"
      ADD COLUMN IF NOT EXISTS "token" text;

      UPDATE "session"
      SET "token" = "id"
      WHERE "token" IS NULL;

      ALTER TABLE "session"
      ALTER COLUMN "token" SET NOT NULL;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'session_token_unique'
        ) THEN
          ALTER TABLE "session" ADD CONSTRAINT session_token_unique UNIQUE ("token");
        END IF;
      END $$;

      ALTER TABLE "account"
      ADD COLUMN IF NOT EXISTS "idToken" text;
    `)

    console.log('Auth schema migration complete (session.token, account.idToken)')
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exitCode = 1
})
