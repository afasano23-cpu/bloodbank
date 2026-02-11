'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Order {
  id: string
  total: number
  status: string
  deliveryMethod: string
  paymentStatus: string
  createdAt: string
  items: Array<{
    quantity: number
    pricePerUnit: number
    listing: {
      animalType: string
      bloodType: string
    }
  }>
  buyer: {
    name: string
    address: string
    phoneNumber: string
  }
  delivery?: {
    status: string
  }
}

export default function SalesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status, router])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/sales')
      const data = await res.json()
      setOrders(data.orders)
    } catch (error) {
      console.error('Error fetching sales:', error)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            VetBlood Bank
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">My Sales</h2>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">You haven&apos;t received any orders yet.</p>
            <Link
              href="/dashboard/listings/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Create a Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Order received {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">Order ID: {order.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      ${order.total.toFixed(2)}
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'Delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'In Transit'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'Confirmed'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between mb-2">
                      <div>
                        <span className="font-medium">{item.listing.animalType} - {item.listing.bloodType}</span>
                        <span className="text-gray-600 ml-2">x{item.quantity}</span>
                      </div>
                      <div className="text-gray-600">
                        ${(item.pricePerUnit * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Buyer</div>
                      <div className="text-gray-600">{order.buyer.name}</div>
                      <div className="text-gray-600">{order.buyer.address}</div>
                      <div className="text-gray-600">{order.buyer.phoneNumber}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Delivery</div>
                      <div className="text-gray-600">{order.deliveryMethod}</div>
                      {order.delivery && (
                        <div className="text-gray-600 mt-1">
                          Status: {order.delivery.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
