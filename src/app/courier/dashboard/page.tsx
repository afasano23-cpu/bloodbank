'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CourierDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && session.user.role !== 'courier') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'courier') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">VetBlood Bank - Courier</h1>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Courier Dashboard
          </h2>
          <p className="text-gray-900">Welcome, {session.user.name}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Status</h3>
              <p className="text-gray-900">
                {isOnline ? 'You are online and available for deliveries' : 'You are offline'}
              </p>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-8 py-3 rounded-md font-medium text-white ${
                isOnline
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/courier/deliveries/available"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Available Deliveries
            </h3>
            <p className="text-gray-900">View and accept delivery requests</p>
          </Link>

          <Link
            href="/courier/deliveries/active"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">🚗</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Active Deliveries
            </h3>
            <p className="text-gray-900">View your ongoing deliveries</p>
          </Link>

          <Link
            href="/courier/history"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Delivery History
            </h3>
            <p className="text-gray-900">View completed deliveries</p>
          </Link>

          <Link
            href="/courier/earnings"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Earnings
            </h3>
            <p className="text-gray-900">View your earnings and payouts</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
