import { format } from 'date-fns'
import { StatCard } from './StatCard'
import type { Stats, Order } from '../types'

interface OverviewTabProps {
  stats: Stats
  recentOrders: Order[]
}

export function OverviewTab({ stats, recentOrders }: OverviewTabProps) {
  return (
    <>
      {/* Primary Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard icon="📊" value={stats.totalOrders} label="Total Orders" />
        <StatCard icon="💰" value={`$${stats.totalRevenue.toFixed(2)}`} label="Revenue (Fees)" color="text-green-600" />
        <StatCard icon="📋" value={stats.activeListings} label="Active Listings" />
        <StatCard icon="🏥" value={stats.totalHospitals} label="Hospitals" />
        <StatCard icon="💬" value={stats.totalOffers} label="Total Offers" />
        <StatCard icon="⏳" value={stats.pendingOffers} label="Pending Offers" color="text-yellow-600" />
      </div>

      {/* New Stats Row */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon="📈"
          value={`$${stats.avgOrderValue.toFixed(2)}`}
          label="Avg Order Value"
          color="text-blue-600"
        />
        <StatCard
          icon="🎯"
          value={`${stats.offerConversionRate.toFixed(1)}%`}
          label="Offer Conversion Rate"
          color="text-purple-600"
        />
        <StatCard
          icon="📊"
          value={`${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth.toFixed(1)}%`}
          label="Revenue Growth (MoM)"
          color={stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}
        />
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

      {/* Top Hospitals & Blood Demand */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Top Hospitals by Volume */}
        {stats.topHospitals.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Hospitals by Volume</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Hospital</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Orders</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topHospitals.map((h) => (
                    <tr key={h.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-900 font-medium">{h.name}</td>
                      <td className="py-2 px-3 text-gray-600">{h.orderCount}</td>
                      <td className="py-2 px-3 text-gray-900 font-semibold">${h.totalVolume.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Blood Type Demand */}
        {stats.bloodDemand.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Blood Type Demand</h3>
            <div className="space-y-3">
              {stats.bloodDemand.slice(0, 10).map((d) => {
                const maxCount = stats.bloodDemand[0].count
                const width = maxCount > 0 ? (d.count / maxCount) * 100 : 0
                return (
                  <div key={`${d.animalType}-${d.bloodType}`} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-28 flex-shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        d.animalType === 'Dog' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {d.animalType}
                      </span>
                      {' '}{d.bloodType}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="bg-red-400 h-full rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(width, 8)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{d.count}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Orders</h3>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500">No orders found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Buyer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Seller</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
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
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
