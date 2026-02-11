'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Listing {
  id: string
  animalType: string
  bloodType: string
  quantity: number
  pricePerUnit: number
  expirationDate: string
  storageConditions: string
  notes: string | null
  isActive: boolean
  createdAt: string
}

export default function ListingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      fetchListings()
    }
  }, [status, router])

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings')
      const data = await res.json()
      setListings(data.listings)
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return
    }

    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setListings(listings.filter(listing => listing.id !== id))
      }
    } catch (error) {
      console.error('Error deleting listing:', error)
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            VetBlood Bank
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">My Blood Listings</h2>
          <Link
            href="/dashboard/listings/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            + Add New Listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-900 mb-4">You haven&apos;t created any listings yet.</p>
            <Link
              href="/dashboard/listings/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {listing.animalType}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {listing.bloodType}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        listing.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {listing.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-900">Quantity:</span>
                        <span className="ml-2 font-medium">{listing.quantity} units</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Price:</span>
                        <span className="ml-2 font-medium">${listing.pricePerUnit} per unit</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Expires:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(listing.expirationDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-900">Storage:</span>
                        <span className="ml-2 font-medium">{listing.storageConditions}</span>
                      </div>
                    </div>

                    {listing.notes && (
                      <div className="mt-3 text-sm text-gray-900">
                        <span className="font-medium">Notes:</span> {listing.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/dashboard/listings/${listing.id}/edit`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      Delete
                    </button>
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
