'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface Stats {
  totalOrders: number
  totalRevenue: number
  activeListings: number
  totalHospitals: number
  totalCouriers: number
}

interface Order {
  id: string
  total: number
  status: string
  createdAt: string
  buyer: { name: string }
  seller: { name: string }
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      if (session.user.role !== 'admin') {
        router.push('/dashboard')
      } else {
        fetchStats()
      }
    }
  }, [status, router])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data.stats)
      setRecentOrders(data.recentOrders)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">VetBlood Bank - Admin</h1>
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
            Admin Dashboard
          </h2>
          <p className="text-gray-600">Platform management and analytics</p>
        </div>

        {stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold text-gray-800">{stats.totalOrders}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-green-600">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Revenue (Service Fees)</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-2xl font-bold text-gray-800">{stats.activeListings}</div>
              <div className="text-sm text-gray-600">Active Listings</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-2">🏥</div>
              <div className="text-2xl font-bold text-gray-800">{stats.totalHospitals}</div>
              <div className="text-sm text-gray-600">Registered Hospitals</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-2">🚗</div>
              <div className="text-2xl font-bold text-gray-800">{stats.totalCouriers}</div>
              <div className="text-sm text-gray-600">Registered Couriers</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="text-gray-600">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Order ID</th>
                    <th className="text-left py-3 px-4">Buyer</th>
                    <th className="text-left py-3 px-4">Seller</th>
                    <th className="text-left py-3 px-4">Total</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-mono">{order.id.slice(0, 8)}...</td>
                      <td className="py-3 px-4">{order.buyer.name}</td>
                      <td className="py-3 px-4">{order.seller.name}</td>
                      <td className="py-3 px-4">${order.total.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'In Transit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
