import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { Listing } from '../types'

export function ListingsTab() {
  const [listings, setListings] = useState<Listing[]>([])
  const [listingAnimalFilter, setListingAnimalFilter] = useState('')
  const [listingStatusFilter, setListingStatusFilter] = useState('')

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

  useEffect(() => {
    fetchListings()
  }, [listingAnimalFilter, listingStatusFilter])

  return (
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
  )
}
