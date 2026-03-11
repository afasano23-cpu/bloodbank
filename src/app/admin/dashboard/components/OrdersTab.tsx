import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { Order } from '../types'

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

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

  useEffect(() => {
    fetchOrders()
  }, [orderStatusFilter])

  return (
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
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-3 font-semibold text-gray-700"></th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Buyer</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Seller</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Subtotal</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Fees (20%)</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-700">Total</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Payment</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Stripe</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)}
                  >
                    <td className="py-3 px-3 text-gray-400">
                      {order.items && order.items.length > 0 && (expandedRow === order.id ? '▼' : '▶')}
                    </td>
                    <td className="py-3 px-3 font-mono text-gray-900 text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="py-3 px-3 text-gray-900">{order.buyer.name}</td>
                    <td className="py-3 px-3 text-gray-900">{order.seller.name}</td>
                    <td className="py-3 px-3 text-right text-gray-900">${order.subtotal.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-orange-600">${order.serviceFee.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-gray-900 font-semibold">${order.total.toFixed(2)}</td>
                    <td className="py-3 px-3">
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
                    <td className="py-3 px-3">
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
                    <td className="py-3 px-3">
                      {order.paymentIntentId && !order.paymentIntentId.startsWith('demo_') ? (
                        <a
                          href={`https://dashboard.stripe.com/payments/${order.paymentIntentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {order.paymentIntentId?.startsWith('demo_') ? 'Demo' : '-'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-600 text-xs">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                  {expandedRow === order.id && order.items && order.items.length > 0 && (
                    <tr key={`${order.id}-items`} className="bg-gray-50">
                      <td colSpan={11} className="py-3 px-8">
                        <div className="text-xs text-gray-600 mb-2 font-medium">Order Items:</div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1 px-2 text-gray-500">Animal</th>
                              <th className="text-left py-1 px-2 text-gray-500">Blood Type</th>
                              <th className="text-left py-1 px-2 text-gray-500">Qty</th>
                              <th className="text-left py-1 px-2 text-gray-500">Price/Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item) => (
                              <tr key={item.id}>
                                <td className="py-1 px-2">{item.listing.animalType}</td>
                                <td className="py-1 px-2">{item.listing.bloodType}</td>
                                <td className="py-1 px-2">{item.quantity}</td>
                                <td className="py-1 px-2">${item.pricePerUnit.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
