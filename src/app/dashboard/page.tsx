'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'hospital') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-800">VetBlood Bank</h1>
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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Hospital Dashboard
          </h2>
          <p className="text-gray-900">Welcome back, {session.user.name}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Link
            href="/dashboard/listings"
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📋</div>
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
              My Listings
            </h3>
            <p className="text-sm sm:text-base text-gray-900 hidden sm:block">Manage your blood inventory</p>
          </Link>

          <Link
            href="/dashboard/purchases"
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🛒</div>
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
              My Purchases
            </h3>
            <p className="text-sm sm:text-base text-gray-900 hidden sm:block">View your orders and track pickup details</p>
          </Link>

          <Link
            href="/dashboard/sales"
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">💰</div>
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
              My Sales
            </h3>
            <p className="text-sm sm:text-base text-gray-900 hidden sm:block">Manage incoming orders</p>
          </Link>

          <Link
            href="/marketplace"
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🔍</div>
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
              Marketplace
            </h3>
            <p className="text-sm sm:text-base text-gray-900 hidden sm:block">Browse available blood products</p>
          </Link>

          <Link
            href="/dashboard/offers"
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">💬</div>
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
              My Offers
            </h3>
            <p className="text-sm sm:text-base text-gray-900 hidden sm:block">View offers you've made on listings</p>
          </Link>

          <Link
            href="/dashboard/offers/received"
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📬</div>
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
              Offers Received
            </h3>
            <p className="text-sm sm:text-base text-gray-900 hidden sm:block">Review and respond to buyer offers</p>
          </Link>

          <Link
            href="/dashboard/notifications"
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🔔</div>
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
              Notifications
            </h3>
            <p className="text-sm sm:text-base text-gray-900 hidden sm:block">View updates and messages</p>
          </Link>

          <Link
            href="/dashboard/settings"
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">⚙️</div>
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
              Settings
            </h3>
            <p className="text-sm sm:text-base text-gray-900 hidden sm:block">Update your profile and preferences</p>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              href="/dashboard/listings/new"
              className="block w-full md:w-auto px-6 py-3 bg-emerald-600 text-white text-center rounded-md hover:bg-emerald-700 font-medium"
            >
              + Add New Blood Listing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
