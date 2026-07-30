'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { attendance, teamAssignment, user } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function validateSupervisor() {
  const userId = await getUserId()
  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))

  if (userData.length === 0 || userData[0].role !== 'supervisor') {
    throw new Error('Unauthorized: Only supervisors can perform this action')
  }

  return userId
}

export async function getTeamMembers() {
  const supervisorId = await validateSupervisor()

  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(teamAssignment)
    .innerJoin(user, eq(teamAssignment.internId, user.id))
    .where(eq(teamAssignment.supervisorId, supervisorId))
}

export async function getTeamAttendance(internId: string) {
  const supervisorId = await validateSupervisor()

  const assignment = await db
    .select()
    .from(teamAssignment)
    .where(
      and(
        eq(teamAssignment.supervisorId, supervisorId),
        eq(teamAssignment.internId, internId),
      ),
    )

  if (assignment.length === 0) {
    throw new Error('Unauthorized: This intern is not in your team')
  }

  return db
    .select()
    .from(attendance)
    .where(eq(attendance.userId, internId))
}

export async function editAttendanceRecord(
  recordId: number,
  clockInTime?: Date,
  clockOutTime?: Date,
  notes?: string,
) {
  const supervisorId = await validateSupervisor()

  const record = await db
    .select()
    .from(attendance)
    .where(eq(attendance.id, recordId))

  if (record.length === 0) {
    throw new Error('Record not found')
  }

  const assignment = await db
    .select()
    .from(teamAssignment)
    .where(
      and(
        eq(teamAssignment.supervisorId, supervisorId),
        eq(teamAssignment.internId, record[0].userId),
      ),
    )

  if (assignment.length === 0) {
    throw new Error('Unauthorized: Cannot edit this record')
  }

  const result = await db
    .update(attendance)
    .set({
      ...(clockInTime && { clockInTime }),
      ...(clockOutTime && { clockOutTime }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date(),
    })
    .where(eq(attendance.id, recordId))
    .returning()

  revalidatePath('/')
  return result[0]
}

export async function deleteAttendanceRecord(recordId: number) {
  const supervisorId = await validateSupervisor()

  const record = await db
    .select()
    .from(attendance)
    .where(eq(attendance.id, recordId))

  if (record.length === 0) {
    throw new Error('Record not found')
  }

  const assignment = await db
    .select()
    .from(teamAssignment)
    .where(
      and(
        eq(teamAssignment.supervisorId, supervisorId),
        eq(teamAssignment.internId, record[0].userId),
      ),
    )

  if (assignment.length === 0) {
    throw new Error('Unauthorized: Cannot delete this record')
  }

  await db.delete(attendance).where(eq(attendance.id, recordId))

  revalidatePath('/')
}
