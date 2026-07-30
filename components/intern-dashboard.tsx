'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clockIn, clockOut, getAttendanceHistory, getCurrentSession } from '@/app/actions/attendance'
import { authClient } from '@/lib/auth-client'
import { formatDistanceToNow, format } from 'date-fns'

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

export function InternDashboard({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [session, historyData] = await Promise.all([
        getCurrentSession(),
        getAttendanceHistory(),
      ])
      setCurrentSession(session)
      setHistory(historyData)
      setError('')
    } catch (err) {
      setError('Failed to load data')
    }
  }

  async function handleClockIn() {
    setLoading(true)
    try {
      const result = await clockIn()
      setCurrentSession(result)
      setError('')
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to clock in')
    } finally {
      setLoading(false)
    }
  }

  async function handleClockOut() {
    setLoading(true)
    try {
      await clockOut()
      setCurrentSession(null)
      setError('')
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to clock out')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await authClient.signOut()
    router.push('/')
  }

  const calculateHours = () => {
    if (!currentSession) return 0
    const now = new Date()
    const diff = now.getTime() - new Date(currentSession.clockInTime).getTime()
    return (diff / (1000 * 60 * 60)).toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">OJT Attendance</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Clock In/Out</h2>

          {currentSession ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <p className="text-gray-600 mb-2">Current Session</p>
                <p className="text-3xl font-bold text-green-600 mb-4">
                  {calculateHours()} hours
                </p>
                <p className="text-sm text-gray-600">
                  Clocked in at {format(new Date(currentSession.clockInTime), 'hh:mm a')}
                </p>
              </div>

              <button
                onClick={handleClockOut}
                disabled={loading}
                className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold rounded-lg text-lg transition"
              >
                {loading ? 'Clocking Out...' : 'Clock Out'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleClockIn}
              disabled={loading}
              className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold rounded-lg text-lg transition"
            >
              {loading ? 'Clocking In...' : 'Clock In'}
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Attendance History</h2>

          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No attendance records yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
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
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => {
                    const duration = record.clockOutTime
                      ? (
                          (new Date(record.clockOutTime).getTime() -
                            new Date(record.clockInTime).getTime()) /
                          (1000 * 60 * 60)
                        ).toFixed(2)
                      : '-'

                    return (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {format(new Date(record.clockInTime), 'MMM dd, yyyy hh:mm a')}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {record.clockOutTime
                            ? format(new Date(record.clockOutTime), 'hh:mm a')
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">{duration} hrs</td>
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
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
