import { auth } from '@/lib/auth'
import Link from 'next/link'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { InternDashboard } from '@/components/intern-dashboard'
import { SupervisorDashboard } from '@/components/supervisor-dashboard'
import { headers } from 'next/headers'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="text-2xl font-bold text-indigo-600">OJT Attendance</div>
            <div className="flex gap-4">
              <Link
                href="/sign-in"
                className="px-6 py-2 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Sign Up
              </Link>
            </div>
          </nav>
        </header>

        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
                Track Your OJT Attendance
              </h1>
              <p className="text-xl text-gray-600">
                Simple, efficient attendance tracking for interns and supervisors
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-12">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">For Interns</h3>
                <ul className="text-gray-600 space-y-2 text-left">
                  <li>✓ Quick clock in/out</li>
                  <li>✓ View your attendance history</li>
                  <li>✓ Track total hours worked</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="text-4xl mb-4">👨‍💼</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  For Supervisors
                </h3>
                <ul className="text-gray-600 space-y-2 text-left">
                  <li>✓ View team attendance</li>
                  <li>✓ Edit records</li>
                  <li>✓ Add notes & corrections</li>
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/sign-up"
                className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const userData = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))

  const userRole = userData[0]?.role || 'intern'

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {userRole === 'supervisor' ? (
        <SupervisorDashboard userId={session.user.id} />
      ) : (
        <InternDashboard userId={session.user.id} />
      )}
    </main>
  )
}
