'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

type Tab = 'overview' | 'hospitals' | 'listings' | 'orders'

interface Stats {
  totalOrders: number
  totalRevenue: number
  activeListings: number
  totalHospitals: number
  totalOffers: number
  pendingOffers: number
  revenueByMonth: Record<string, number>
}

interface Order {
  id: string
  total: number
  status: string
  paymentStatus: string
  createdAt: string
  buyer: { name: string }
  seller: { name: string }
}

interface Hospital {
  id: string
  name: string
  email: string
  address: string
  phoneNumber: string
  stripeAccountId: string | null
  createdAt: string
  _count: {
    bloodListings: number
    purchaseOrders: number
    saleOrders: number
  }
}

interface Listing {
  id: string
  animalType: string
  bloodType: string
  quantity: number
  pricePerUnit: number
  expirationDate: string
  isActive: boolean
  hospital: { name: string }
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [listingAnimalFilter, setListingAnimalFilter] = useState('')
  const [listingStatusFilter, setListingStatusFilter] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')

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

  useEffect(() => {
    if (status !== 'authenticated' || session?.user.role !== 'admin') return

    if (activeTab === 'hospitals') fetchHospitals()
    else if (activeTab === 'listings') fetchListings()
    else if (activeTab === 'orders') fetchOrders()
  }, [activeTab, status])

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

  const fetchHospitals = async () => {
    try {
      const params = new URLSearchParams()
      if (hospitalSearch) params.set('search', hospitalSearch)
      const res = await fetch(`/api/admin/hospitals?${params}`)
      const data = await res.json()
      setHospitals(data.hospitals)
    } catch (error) {
      console.error('Error fetching hospitals:', error)
    }
  }

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams()
      if (listingAnimalFilter) params.set('animalType', listingAnimalFilter)
      if (listingStatusFilter) params.set('status', listingStatusFilter)
      const res = await fetch(`/api/admin/listings?${params}`)
      const data = await res.json()
      setListings(data.listings)
    } catch (error) {
      console.error('Error fetching listings:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (orderStatusFilter) params.set('status', orderStatusFilter)
      const res = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  // Re-fetch when filters change
  useEffect(() => {
    if (activeTab === 'hospitals') fetchHospitals()
  }, [hospitalSearch])

  useEffect(() => {
    if (activeTab === 'listings') fetchListings()
  }, [listingAnimalFilter, listingStatusFilter])

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders()
  }, [orderStatusFilter])

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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'hospitals', label: 'Hospitals' },
    { key: 'listings', label: 'Listings' },
    { key: 'orders', label: 'Orders' },
  ]

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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h2>
          <p className="text-gray-900">Platform management and analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex gap-0 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              <StatCard icon="📊" value={stats.totalOrders} label="Total Orders" />
              <StatCard icon="💰" value={`$${stats.totalRevenue.toFixed(2)}`} label="Revenue (Fees)" color="text-green-600" />
              <StatCard icon="📋" value={stats.activeListings} label="Active Listings" />
              <StatCard icon="🏥" value={stats.totalHospitals} label="Hospitals" />
              <StatCard icon="💬" value={stats.totalOffers} label="Total Offers" />
              <StatCard icon="⏳" value={stats.pendingOffers} label="Pending Offers" color="text-yellow-600" />
            </div>

            {/* Revenue by Month */}
            {Object.keys(stats.revenueByMonth).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Revenue (Last 6 Months)</h3>
                <div className="space-y-3">
                  {Object.entries(stats.revenueByMonth)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([month, revenue]) => {
                      const maxRevenue = Math.max(...Object.values(stats.revenueByMonth))
                      const width = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0
                      return (
                        <div key={month} className="flex items-center gap-4">
                          <span className="text-sm text-gray-600 w-20">{month}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${Math.max(width, 5)}%` }}
                            >
                              <span className="text-xs text-white font-medium">${revenue.toFixed(0)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Recent Orders Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Orders</h3>
              <OrdersTable orders={recentOrders} />
            </div>
          </>
        )}

        {/* Hospitals Tab */}
        {activeTab === 'hospitals' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-xl font-semibold text-gray-800">All Hospitals</h3>
              <input
                type="text"
                placeholder="Search by name..."
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Listings</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Orders</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Stripe</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map((h) => (
                    <tr key={h.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{h.name}</td>
                      <td className="py-3 px-4 text-gray-600">{h.email}</td>
                      <td className="py-3 px-4 text-gray-600">{h.phoneNumber}</td>
                      <td className="py-3 px-4 text-gray-900">{h._count.bloodListings}</td>
                      <td className="py-3 px-4 text-gray-900">{h._count.purchaseOrders + h._count.saleOrders}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          h.stripeAccountId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {h.stripeAccountId ? 'Connected' : 'Not connected'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {format(new Date(h.createdAt), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                  {hospitals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">No hospitals found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-xl font-semibold text-gray-800">All Listings</h3>
              <div className="flex gap-2">
                <select
                  value={listingAnimalFilter}
                  onChange={(e) => setListingAnimalFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                >
                  <option value="">All Animals</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
                <select
                  value={listingStatusFilter}
                  onChange={(e) => setListingStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Animal</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Blood Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Qty</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Price/Unit</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Hospital</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => (
                    <tr key={l.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {l.animalType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900">{l.bloodType}</td>
                      <td className="py-3 px-4 text-gray-900">{l.quantity}</td>
                      <td className="py-3 px-4 text-gray-900">${l.pricePerUnit.toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-600">{l.hospital.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          l.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {l.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {format(new Date(l.expirationDate), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                  {listings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">No listings found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-xl font-semibold text-gray-800">All Orders</h3>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <OrdersTable orders={orders} showPaymentStatus />
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, color }: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color || 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-900 font-medium">{label}</div>
    </div>
  )
}

function OrdersTable({ orders, showPaymentStatus }: { orders: Order[]; showPaymentStatus?: boolean }) {
  if (orders.length === 0) {
    return <p className="text-gray-500">No orders found</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Buyer</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Seller</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
            {showPaymentStatus && (
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment</th>
            )}
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4 font-mono text-gray-900 text-xs">{order.id.slice(0, 8)}...</td>
              <td className="py-3 px-4 text-gray-900">{order.buyer.name}</td>
              <td className="py-3 px-4 text-gray-900">{order.seller.name}</td>
              <td className="py-3 px-4 text-gray-900 font-semibold">${order.total.toFixed(2)}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'Delivered'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'In Transit'
                    ? 'bg-blue-100 text-blue-800'
                    : order.status === 'Cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status}
                </span>
              </td>
              {showPaymentStatus && (
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'Paid'
                      ? 'bg-green-100 text-green-800'
                      : order.paymentStatus === 'Failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </td>
              )}
              <td className="py-3 px-4 text-gray-600 text-xs">
                {format(new Date(order.createdAt), 'MMM dd, yyyy')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
