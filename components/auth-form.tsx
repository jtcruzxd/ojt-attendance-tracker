'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Something went wrong')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSignUp && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            placeholder="John Doe"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
      >
        {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
      </button>

      <p className="text-sm text-gray-600 text-center">
        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
        <Link
          href={isSignUp ? '/sign-in' : '/sign-up'}
          className="text-indigo-600 font-semibold hover:underline"
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </Link>
      </p>
    </form>
  )
}
