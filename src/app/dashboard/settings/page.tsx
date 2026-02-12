'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

interface StripeStatus {
  connected: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  demoMode?: boolean
}

function SettingsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
  const [stripeLoading, setStripeLoading] = useState(true)
  const [connectingStripe, setConnectingStripe] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/stripe/connect/status')
        .then(res => res.json())
        .then(data => setStripeStatus(data))
        .catch(console.error)
        .finally(() => setStripeLoading(false))
    }
  }, [status])

  useEffect(() => {
    const stripeParam = searchParams.get('stripe')
    if (stripeParam === 'connected') {
      setMessage('Stripe account connected successfully!')
      fetch('/api/stripe/connect/status')
        .then(res => res.json())
        .then(data => setStripeStatus(data))
    } else if (stripeParam === 'refresh') {
      setMessage('Your onboarding link expired. Please try again.')
    }
  }, [searchParams])

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error)
    } finally {
      setConnectingStripe(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            VetBlood Bank
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Account Settings</h2>

        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital Name
              </label>
              <input
                type="text"
                defaultValue={session?.user.name || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                defaultValue={session?.user.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900"
              />
            </div>
            <p className="text-sm text-gray-900">
              To update your profile information, please contact support.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Settings</h3>

          {stripeLoading ? (
            <p className="text-gray-500">Loading payment status...</p>
          ) : stripeStatus?.connected && stripeStatus.chargesEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-green-700 font-medium">Stripe account connected</span>
              </div>
              <p className="text-sm text-gray-600">
                Payments for your sales will be deposited directly to your connected bank account.
              </p>
              {stripeStatus.demoMode && (
                <p className="text-xs text-blue-600">Demo mode: simulated connection</p>
              )}
            </div>
          ) : stripeStatus?.connected && !stripeStatus.detailsSubmitted ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="text-yellow-700 font-medium">Onboarding incomplete</span>
              </div>
              <p className="text-sm text-gray-600">
                You started connecting your Stripe account but did not finish. Please complete onboarding to receive payments.
              </p>
              <button
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {connectingStripe ? 'Redirecting...' : 'Complete Stripe Onboarding'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Connect your Stripe account to receive payments directly when your blood products are purchased.
                Without a connected account, sales revenue will be held by the platform.
              </p>
              <button
                onClick={handleConnectStripe}
                disabled={connectingStripe}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {connectingStripe ? 'Redirecting...' : 'Connect Stripe Account'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>

          {passwordError && (
            <div className={`mb-4 p-3 rounded ${passwordError.includes('successfully') ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
              {passwordError}
            </div>
          )}

          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault()
            setPasswordError('')
            setPasswordLoading(true)

            const formData = new FormData(e.currentTarget)
            const currentPassword = formData.get('currentPassword') as string
            const newPassword = formData.get('newPassword') as string
            const confirmPassword = formData.get('confirmPassword') as string

            if (newPassword !== confirmPassword) {
              setPasswordError('New passwords do not match')
              setPasswordLoading(false)
              return
            }

            if (newPassword.length < 6) {
              setPasswordError('New password must be at least 6 characters')
              setPasswordLoading(false)
              return
            }

            try {
              const res = await fetch('/api/account/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
              })

              const data = await res.json()

              if (!res.ok) {
                setPasswordError(data.error || 'Failed to update password')
              } else {
                setPasswordError('Password updated successfully!')
                ;(e.target as HTMLFormElement).reset()
              }
            } catch {
              setPasswordError('An error occurred. Please try again.')
            } finally {
              setPasswordLoading(false)
            }
          }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
