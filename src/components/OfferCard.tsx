'use client'

import { Offer } from '@/types/offer'
import OfferStatusBadge from './OfferStatusBadge'
import { getTimeRemaining, calculateOfferTotals } from '@/lib/offers'
import Link from 'next/link'

interface OfferCardProps {
  offer: Offer
  viewMode: 'buyer' | 'seller'
  onAccept?: (offerId: string) => void
  onReject?: (offerId: string) => void
  onCancel?: (offerId: string) => void
}

export default function OfferCard({
  offer,
  viewMode,
  onAccept,
  onReject,
  onCancel
}: OfferCardProps) {
  const totals = calculateOfferTotals(offer.quantity, offer.offeredPrice)
  const listingPrice = offer.listing?.pricePerUnit || 0
  const priceDiff = offer.offeredPrice - listingPrice
  const priceDiffPercent = listingPrice > 0 ? (priceDiff / listingPrice) * 100 : 0

  const timeRemaining = offer.status === 'Pending' ? getTimeRemaining(offer.expiresAt) : null

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-gray-800">
              {offer.listing?.animalType} Blood • Type {offer.listing?.bloodType}
            </h3>
            <OfferStatusBadge status={offer.status} />
          </div>
          <p className="text-sm text-gray-600">
            {viewMode === 'buyer' ? (
              <>From: {offer.listing?.hospital.name}</>
            ) : (
              <>From: {offer.buyer?.name}</>
            )}
          </p>
          {timeRemaining && timeRemaining !== 'Expired' && (
            <p className="text-xs text-yellow-700 font-medium mt-1">
              ⏰ Expires in {timeRemaining}
            </p>
          )}
        </div>
      </div>

      {/* Offer Details */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Quantity</p>
          <p className="text-base sm:text-lg font-semibold text-gray-800">{offer.quantity} units</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Offered Price</p>
          <p className="text-base sm:text-lg font-semibold text-purple-600">
            ${offer.offeredPrice.toFixed(2)}/unit
          </p>
        </div>
      </div>

      {/* Price Comparison */}
      <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3 mb-4">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">Listing Price:</span>
          <span className="font-medium">${listingPrice.toFixed(2)}/unit</span>
        </div>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">Offered Price:</span>
          <span className="font-medium text-purple-600">
            ${offer.offeredPrice.toFixed(2)}/unit
          </span>
        </div>
        {priceDiff !== 0 && (
          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
            <span className="text-gray-600">Difference:</span>
            <span
              className={`font-semibold ${
                priceDiff < 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {priceDiff < 0 ? '' : '+'}${priceDiff.toFixed(2)} ({priceDiffPercent.toFixed(1)}%)
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 mt-2">
          <span className="font-medium text-gray-700">Total (with fees):</span>
          <span className="font-bold text-gray-800">${totals.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Message */}
      {offer.message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-blue-800 font-medium mb-1">Message from buyer:</p>
          <p className="text-sm text-blue-900">{offer.message}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs text-gray-500 mb-4">
        <p>Created: {new Date(offer.createdAt).toLocaleString()}</p>
        {offer.acceptedAt && (
          <p className="text-green-600">
            Accepted: {new Date(offer.acceptedAt).toLocaleString()}
          </p>
        )}
        {offer.rejectedAt && (
          <p className="text-red-600">
            Rejected: {new Date(offer.rejectedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {viewMode === 'buyer' && (
          <>
            <Link
              href={`/marketplace/${offer.listingId}`}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium text-center text-sm"
            >
              View Listing
            </Link>
            {offer.status === 'Pending' && onCancel && (
              <button
                onClick={() => onCancel(offer.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-sm"
              >
                Cancel Offer
              </button>
            )}
          </>
        )}

        {viewMode === 'seller' && (
          <>
            {offer.status === 'Pending' && (
              <>
                {onReject && (
                  <button
                    onClick={() => onReject(offer.id)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium text-sm"
                  >
                    Reject
                  </button>
                )}
                {onAccept && (
                  <button
                    onClick={() => onAccept(offer.id)}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium text-sm"
                  >
                    Accept Offer
                  </button>
                )}
              </>
            )}
            <Link
              href={`/marketplace/${offer.listingId}`}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium text-center text-sm"
            >
              View Listing
            </Link>
          </>
        )}
      </div>

      {/* Contact Info for Seller */}
      {viewMode === 'seller' && offer.buyer && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Buyer Contact:</p>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Name:</strong> {offer.buyer.name}</p>
            <p><strong>Email:</strong> {offer.buyer.email}</p>
            <p><strong>Phone:</strong> {offer.buyer.phoneNumber}</p>
            <p><strong>Address:</strong> {offer.buyer.address}</p>
          </div>
        </div>
      )}
    </div>
  )
}
