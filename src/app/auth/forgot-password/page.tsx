'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [userType, setUserType] = useState<'hospital' | 'admin'>('hospital')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">VetBlood Bank</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Forgot Password</h2>
          <p className="text-sm text-gray-500">Enter your email to receive a reset link</p>
        </div>

        {submitted ? (
          <div>
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
              If an account with that email exists, we&apos;ve sent a password reset link. Check your inbox.
            </div>
            <Link
              href="/auth/login"
              className="block w-full text-center py-2 px-4 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUserType('hospital')}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    userType === 'hospital'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Hospital
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('admin')}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    userType === 'admin'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
