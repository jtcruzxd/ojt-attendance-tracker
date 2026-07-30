'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { attendance } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function clockIn() {
  const userId = await getUserId()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existingEntry = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.userId, userId),
        eq(attendance.clockOutTime, null),
      ),
    )

  if (existingEntry.length > 0) {
    throw new Error('Already clocked in')
  }

  const result = await db
    .insert(attendance)
    .values({
      userId,
      clockInTime: new Date(),
      status: 'active',
    })
    .returning()

  revalidatePath('/')
  return result[0]
}

export async function clockOut() {
  const userId = await getUserId()

  const activeEntry = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.userId, userId),
        eq(attendance.clockOutTime, null),
      ),
    )

  if (activeEntry.length === 0) {
    throw new Error('No active clock in found')
  }

  const result = await db
    .update(attendance)
    .set({
      clockOutTime: new Date(),
      status: 'completed',
      updatedAt: new Date(),
    })
    .where(eq(attendance.id, activeEntry[0].id))
    .returning()

  revalidatePath('/')
  return result[0]
}

export async function getAttendanceHistory(limit: number = 30) {
  const userId = await getUserId()

  return db
    .select()
    .from(attendance)
    .where(eq(attendance.userId, userId))
    .orderBy(desc(attendance.clockInTime))
    .limit(limit)
}

export async function getCurrentSession() {
  const userId = await getUserId()

  const activeSession = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.userId, userId),
        eq(attendance.clockOutTime, null),
      ),
    )

  return activeSession.length > 0 ? activeSession[0] : null
}
