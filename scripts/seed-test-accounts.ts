/**
 * Seeds demo admin (supervisor) and intern accounts for local/dev use.
 *
 * Usage:
 *   npm run seed
 *
 * Requires DATABASE_URL (and BETTER_AUTH_SECRET) in .env.local or .env
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile(resolve(process.cwd(), '.env'))

// Local seed must not inherit production BETTER_AUTH_URL from vercel env pull
process.env.BETTER_AUTH_URL = 'http://localhost:3000'

const TEST_ACCOUNTS = [
  {
    name: 'Test Admin',
    email: 'admin@ojt.test',
    password: 'Admin1234!',
    // App elevated role is "supervisor" (admin dashboard is not implemented yet)
    role: 'supervisor' as const,
  },
  {
    name: 'Test Intern',
    email: 'intern@ojt.test',
    password: 'Intern1234!',
    role: 'intern' as const,
  },
] as const

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is missing. Copy .env.example to .env.local, set your Neon URL, then re-run.',
    )
  }

  const { and, eq } = await import('drizzle-orm')
  const { auth } = await import('../lib/auth')
  const { db, pool } = await import('../lib/db')
  const { account, session, teamAssignment, user } =
    await import('../lib/db/schema')

  async function wipeUser(email: string) {
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1)
    if (existing.length === 0) return

    const userId = existing[0].id
    await db.delete(teamAssignment).where(eq(teamAssignment.internId, userId))
    await db
      .delete(teamAssignment)
      .where(eq(teamAssignment.supervisorId, userId))
    await db.delete(session).where(eq(session.userId, userId))
    await db.delete(account).where(eq(account.userId, userId))
    await db.delete(user).where(eq(user.id, userId))
    console.log(`Removed stale user ${email}`)
  }

  async function ensureAccount(accountDef: (typeof TEST_ACCOUNTS)[number]) {
    await wipeUser(accountDef.email)

    const result = await auth.api.signUpEmail({
      body: {
        name: accountDef.name,
        email: accountDef.email,
        password: accountDef.password,
      },
    })

    const userId = result.user.id

    await db
      .update(user)
      .set({ role: accountDef.role, updatedAt: new Date() })
      .where(eq(user.id, userId))

    console.log(`Created ${accountDef.email} (${accountDef.role})`)
    return userId
  }

  async function ensureTeamLink(internId: string, supervisorId: string) {
    const existing = await db
      .select()
      .from(teamAssignment)
      .where(
        and(
          eq(teamAssignment.internId, internId),
          eq(teamAssignment.supervisorId, supervisorId),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      console.log('Team assignment already linked')
      return
    }

    await db.insert(teamAssignment).values({
      internId,
      supervisorId,
    })
    console.log('Linked intern → admin (supervisor)')
  }

  try {
    const adminId = await ensureAccount(TEST_ACCOUNTS[0])
    const internId = await ensureAccount(TEST_ACCOUNTS[1])
    await ensureTeamLink(internId, adminId)

    console.log('\nTest accounts ready:')
    console.log('  Admin  → admin@ojt.test  / Admin1234!')
    console.log('  Intern → intern@ojt.test / Intern1234!')
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exitCode = 1
})
