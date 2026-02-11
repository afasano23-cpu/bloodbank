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
  hospital: {
    name: string
    address: string
  }
}

const DOG_BLOOD_TYPES = ['DEA 1.1+', 'DEA 1.1-', 'DEA 3', 'DEA 4', 'DEA 5', 'DEA 7']
const CAT_BLOOD_TYPES = ['Type A', 'Type B', 'Type AB']

export default function MarketplacePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    animalType: '',
    bloodType: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      fetchListings()
    }
  }, [status, router, filters])

  const fetchListings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.animalType) params.append('animalType', filters.animalType)
      if (filters.bloodType) params.append('bloodType', filters.bloodType)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)
      params.append('sortBy', filters.sortBy)

      const res = await fetch(`/api/marketplace?${params.toString()}`)
      const data = await res.json()
      setListings(data.listings)
    } catch (error) {
      console.error('Error fetching marketplace listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const bloodTypeOptions = filters.animalType === 'Dog'
    ? DOG_BLOOD_TYPES
    : filters.animalType === 'Cat'
    ? CAT_BLOOD_TYPES
    : []

  if (status === 'loading') {
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
          <Link href="/dashboard" className="text-2xl font-bold text-blue-800">
            VetBlood Bank
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Blood Marketplace</h2>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Search & Filter</h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Animal Type
              </label>
              <select
                value={filters.animalType}
                onChange={(e) => setFilters({ ...filters, animalType: e.target.value, bloodType: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Type
              </label>
              <select
                value={filters.bloodType}
                onChange={(e) => setFilters({ ...filters, bloodType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={!filters.animalType}
              >
                <option value="">All</option>
                {bloodTypeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price ($)
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price ($)
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                placeholder="1000"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="createdAt">Date Posted</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="expiration">Expiration Date</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl">Loading listings...</div>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-900">No listings found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/marketplace/${listing.id}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {listing.animalType}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {listing.bloodType}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-900">Quantity:</span>
                    <span className="ml-2 font-medium">{listing.quantity} units</span>
                  </div>
                  <div>
                    <span className="text-gray-900">Price:</span>
                    <span className="ml-2 font-medium text-lg text-green-600">
                      ${listing.pricePerUnit}/unit
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-900">Expires:</span>
                    <span className="ml-2 font-medium">
                      {format(new Date(listing.expirationDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-800">{listing.hospital.name}</div>
                    <div className="text-gray-900">{listing.hospital.address}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-blue-600 font-medium">View Details →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
