import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { AdminOffer, OfferStatusCounts } from '../types'

const statusStyles: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Accepted: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Expired: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-orange-100 text-orange-800',
}

export function OffersTab() {
  const [offers, setOffers] = useState<AdminOffer[]>([])
  const [statusCounts, setStatusCounts] = useState<OfferStatusCounts | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchOffers = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/offers?${params}`)
      const data = await res.json()
      setOffers(data.offers)
      setStatusCounts(data.statusCounts)
    } catch (error) {
      console.error('Error fetching offers:', error)
    }
  }

  useEffect(() => {
    fetchOffers()
  }, [statusFilter])

  return (
    <>
      {/* Status Count Badges */}
      {statusCounts && (
        <div className="flex flex-wrap gap-3 mb-6">
          {(Object.entries(statusCounts) as [string, number][]).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                statusFilter === status
                  ? 'ring-2 ring-blue-500 ring-offset-1'
                  : ''
              } ${statusStyles[status] || 'bg-gray-100 text-gray-600'}`}
            >
              {status}: {count}
            </button>
          ))}
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}

      {/* Offers Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">All Offers</h3>
        {offers.length === 0 ? (
          <p className="text-gray-500">No offers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Buyer</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Seller</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Blood</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-700">Listing Price</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-700">Offered</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-700">Discount</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Qty</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700">Expires</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => {
                  const discount = offer.listing.pricePerUnit > 0
                    ? ((1 - offer.offeredPrice / offer.listing.pricePerUnit) * 100)
                    : 0
                  return (
                    <tr key={offer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 text-gray-600 text-xs">
                        {format(new Date(offer.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-3 text-gray-900">{offer.buyer.name}</td>
                      <td className="py-3 px-3 text-gray-900">{offer.listing.hospital.name}</td>
                      <td className="py-3 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          offer.listing.animalType === 'Dog' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {offer.listing.animalType}
                        </span>
                        {' '}{offer.listing.bloodType}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-600">${offer.listing.pricePerUnit.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-gray-900 font-semibold">${offer.offeredPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`text-xs font-medium ${discount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {discount > 0 ? `-${discount.toFixed(1)}%` : discount < 0 ? `+${Math.abs(discount).toFixed(1)}%` : '0%'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-900">{offer.quantity}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[offer.status] || ''}`}>
                          {offer.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 text-xs">
                        {format(new Date(offer.expiresAt), 'MMM dd HH:mm')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
