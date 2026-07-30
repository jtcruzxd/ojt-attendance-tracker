'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getTeamMembers, getTeamAttendance, deleteAttendanceRecord } from '@/app/actions/supervisor'
import { authClient } from '@/lib/auth-client'
import { format } from 'date-fns'

interface TeamMember {
  id: string
  name: string | null
  email: string
}

interface AttendanceRecord {
  id: number
  userId: string
  clockInTime: Date
  clockOutTime: Date | null
  status: string
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export function SupervisorDashboard({ userId }: { userId: string }) {
  const router = useRouter()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [memberAttendance, setMemberAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTeamMembers()
  }, [])

  useEffect(() => {
    if (selectedMember) {
      loadMemberAttendance(selectedMember)
    }
  }, [selectedMember])

  async function loadTeamMembers() {
    try {
      const members = await getTeamMembers()
      setTeamMembers(members)
      if (members.length > 0) {
        setSelectedMember(members[0].id)
      }
    } catch (err: any) {
      setError('Failed to load team members')
    }
  }

  async function loadMemberAttendance(memberId: string) {
    setLoading(true)
    try {
      const attendance = await getTeamAttendance(memberId)
      setMemberAttendance(attendance)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteRecord(recordId: number) {
    if (!confirm('Are you sure you want to delete this record?')) return

    try {
      await deleteAttendanceRecord(recordId)
      if (selectedMember) {
        await loadMemberAttendance(selectedMember)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete record')
    }
  }

  async function handleLogout() {
    await authClient.signOut()
    router.push('/')
  }

  const calculateTotalHours = () => {
    return memberAttendance
      .filter((r) => r.clockOutTime)
      .reduce((total, record) => {
        const duration =
          (new Date(record.clockOutTime!).getTime() -
            new Date(record.clockInTime).getTime()) /
          (1000 * 60 * 60)
        return total + duration
      }, 0)
      .toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">OJT Attendance - Supervisor</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1 bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Team Members</h2>

            {teamMembers.length === 0 ? (
              <p className="text-gray-500 text-sm">No team members assigned yet</p>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedMember === member.id
                        ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium text-sm">{member.name || 'Unnamed'}</p>
                    <p className="text-xs text-gray-600">{member.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-3 bg-white rounded-2xl shadow-xl p-8">
            {selectedMember ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Attendance Records</h2>
                  <p className="text-gray-600">
                    Total Hours: <span className="font-bold text-lg text-indigo-600">{calculateTotalHours()}</span>
                  </p>
                </div>

                {loading ? (
                  <p className="text-center text-gray-500 py-8">Loading...</p>
                ) : memberAttendance.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No attendance records</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Date
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Clock In
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Clock Out
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Duration
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            Status
                          </th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberAttendance.map((record) => {
                          const duration = record.clockOutTime
                            ? (
                                (new Date(record.clockOutTime).getTime() -
                                  new Date(record.clockInTime).getTime()) /
                                (1000 * 60 * 60)
                              ).toFixed(2)
                            : '-'

                          return (
                            <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900">
                                {format(new Date(record.clockInTime), 'MMM dd, yyyy')}
                              </td>
                              <td className="py-3 px-4 text-gray-900">
                                {format(new Date(record.clockInTime), 'hh:mm a')}
                              </td>
                              <td className="py-3 px-4 text-gray-900">
                                {record.clockOutTime
                                  ? format(new Date(record.clockOutTime), 'hh:mm a')
                                  : '-'}
                              </td>
                              <td className="py-3 px-4 text-gray-900">{duration} hrs</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                    record.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {record.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleDeleteRecord(record.id)}
                                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">Select a team member to view records</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
