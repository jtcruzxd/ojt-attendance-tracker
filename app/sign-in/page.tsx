import { auth } from '@/lib/auth'
import { AuthForm } from '@/components/auth-form'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/')

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
            <p className="text-gray-600">Welcome to OJT Attendance Tracker</p>
          </div>
          <AuthForm mode="sign-in" />
        </div>
      </div>
    </main>
  )
}
