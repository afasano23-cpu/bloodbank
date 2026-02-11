'use client'

import { useState } from 'react'
import { calculateOfferTotals } from '@/lib/offers'

interface Listing {
  id: string
  animalType: string
  bloodType: string
  quantity: number
  pricePerUnit: number
  expirationDate: string
  storageConditions: string
  notes?: string | null
  hospital: {
    name: string
    address: string
  }
}

interface MakeOfferModalProps {
  listing: Listing
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function MakeOfferModal({
  listing,
  isOpen,
  onClose,
  onSuccess
}: MakeOfferModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [offeredPrice, setOfferedPrice] = useState(listing.pricePerUnit)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totals = calculateOfferTotals(quantity, offeredPrice)
  const listingTotal = calculateOfferTotals(quantity, listing.pricePerUnit)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Validation
      if (quantity < 1 || quantity > listing.quantity) {
        setError(`Quantity must be between 1 and ${listing.quantity}`)
        setIsSubmitting(false)
        return
      }

      if (offeredPrice <= 0) {
        setError('Price must be greater than 0')
        setIsSubmitting(false)
        return
      }

      if (message && message.length > 500) {
        setError('Message must be 500 characters or less')
        setIsSubmitting(false)
        return
      }

      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          offeredPrice,
          quantity,
          message: message || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create offer')
        setIsSubmitting(false)
        return
      }

      onSuccess()
      onClose()

      // Reset form
      setQuantity(1)
      setOfferedPrice(listing.pricePerUnit)
      setMessage('')
    } catch (err) {
      console.error('Error creating offer:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Make an Offer</h2>
              <p className="text-sm text-gray-600 mt-1">
                {listing.animalType} Blood • Type {listing.bloodType}
              </p>
              <p className="text-xs text-gray-500">{listing.hospital.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Quantity Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (units)
              </label>
              <input
                type="number"
                min="1"
                max={listing.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {listing.quantity} units
              </p>
            </div>

            {/* Price Per Unit Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Offer Price (per unit)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">Listing price: ${listing.pricePerUnit.toFixed(2)}</span>
                {offeredPrice !== listing.pricePerUnit && (
                  <span
                    className={`font-medium ${
                      offeredPrice < listing.pricePerUnit
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {offeredPrice < listing.pricePerUnit ? '↓' : '↑'}{' '}
                    {Math.abs(
                      ((offeredPrice - listing.pricePerUnit) / listing.pricePerUnit) * 100
                    ).toFixed(1)}
                    %
                  </span>
                )}
              </div>
            </div>

            {/* Optional Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message to Seller (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Add a note to explain your offer..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {message.length}/500 characters
              </p>
            </div>

            {/* Price Breakdown */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Your Offer Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee (10%):</span>
                  <span className="font-medium">${totals.serviceFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-purple-200 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-800">Total if Accepted:</span>
                  <span className="font-bold text-purple-600 text-lg">
                    ${totals.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {offeredPrice !== listing.pricePerUnit && (
                <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>At listing price:</span>
                    <span>${listingTotal.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-purple-700 mt-1">
                    <span>You save:</span>
                    <span>
                      {listingTotal.total > totals.total ? '+' : ''}$
                      {(listingTotal.total - totals.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Expiration Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⏰ This offer will expire in 24 hours if not accepted by the seller.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Offer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
