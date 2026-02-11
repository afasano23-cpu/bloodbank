'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import MakeOfferModal from '@/components/MakeOfferModal'

interface Listing {
  id: string
  animalType: string
  bloodType: string
  quantity: number
  pricePerUnit: number
  expirationDate: string
  storageConditions: string
  notes: string | null
  hospital: {
    name: string
    address: string
    phoneNumber: string
  }
}

export default function ListingDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      fetchListing()
    }
  }, [status, router, params.id])

  const fetchListing = async () => {
    try {
      const res = await fetch(`/api/listings/${params.id}`)
      const data = await res.json()
      setListing(data.listing)
    } catch (error) {
      console.error('Error fetching listing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = () => {
    if (listing) {
      router.push(`/checkout/${listing.id}?quantity=${quantity}`)
    }
  }

  const handleOfferSuccess = () => {
    setSuccessMessage('Offer submitted successfully! The seller will be notified.')
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Listing not found</div>
      </div>
    )
  }

  const subtotal = listing.pricePerUnit * quantity
  const buyerFee = subtotal * 0.10
  const total = subtotal + buyerFee

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            VetBlood Bank
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/marketplace"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Marketplace
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
              {listing.animalType}
            </span>
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-medium">
              {listing.bloodType}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-900">Available Quantity:</span>
                  <span className="ml-2 font-medium">{listing.quantity} units</span>
                </div>
                <div>
                  <span className="text-gray-900">Price per Unit:</span>
                  <span className="ml-2 font-medium text-xl text-green-600">
                    ${listing.pricePerUnit.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-900">Expiration Date:</span>
                  <span className="ml-2 font-medium">
                    {format(new Date(listing.expirationDate), 'MMMM dd, yyyy')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-900">Storage Conditions:</span>
                  <span className="ml-2 font-medium">{listing.storageConditions}</span>
                </div>
              </div>

              {listing.notes && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-800 mb-2">Additional Notes</h4>
                  <p className="text-gray-900">{listing.notes}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Seller Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div>
                  <span className="text-gray-900">Hospital:</span>
                  <span className="ml-2 font-medium">{listing.hospital.name}</span>
                </div>
                <div>
                  <span className="text-gray-900">Address:</span>
                  <span className="ml-2 font-medium">{listing.hospital.address}</span>
                </div>
                <div>
                  <span className="text-gray-900">Phone:</span>
                  <span className="ml-2 font-medium">{listing.hospital.phoneNumber}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Purchase</h3>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="mb-6">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  max={listing.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(listing.quantity, parseInt(e.target.value) || 1)))}
                  className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-900">
                  <span>Subtotal ({quantity} units):</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-900">
                  <span>Service Fee (10%):</span>
                  <span className="font-medium">${buyerFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-700 pt-2">
                  Seller receives 90% (${(subtotal * 0.90).toFixed(2)})
                </p>
              </div>

              <button
                onClick={handlePurchase}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium text-lg"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => setShowOfferModal(true)}
                className="w-full mt-3 bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 font-medium text-lg"
              >
                💬 Make an Offer
              </button>

              {successMessage && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {listing && (
        <MakeOfferModal
          listing={listing}
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          onSuccess={handleOfferSuccess}
        />
      )}
    </div>
  )
}
