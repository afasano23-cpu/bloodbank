import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { Hospital } from '../types'

export function HospitalsTab() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [hospitalSearch, setHospitalSearch] = useState('')

  const fetchHospitals = async () => {
    try {
      const params = new URLSearchParams()
      if (hospitalSearch) params.set('search', hospitalSearch)
      const res = await fetch(`/api/admin/hospitals?${params}`)
      const data = await res.json()
      setHospitals(data.hospitals)
    } catch (error) {
      console.error('Error fetching hospitals:', error)
    }
  }

  useEffect(() => {
    fetchHospitals()
  }, [hospitalSearch])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h3 className="text-xl font-semibold text-gray-800">All Hospitals</h3>
        <input
          type="text"
          placeholder="Search by name..."
          value={hospitalSearch}
          onChange={(e) => setHospitalSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Listings</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Orders</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Stripe</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
            </tr>
          </thead>
          <tbody>
            {hospitals.map((h) => (
              <tr key={h.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 font-medium">{h.name}</td>
                <td className="py-3 px-4 text-gray-600">{h.email}</td>
                <td className="py-3 px-4 text-gray-600">{h.phoneNumber}</td>
                <td className="py-3 px-4 text-gray-900">{h._count.bloodListings}</td>
                <td className="py-3 px-4 text-gray-900">{h._count.purchaseOrders + h._count.saleOrders}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    h.stripeAccountId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {h.stripeAccountId ? 'Connected' : 'Not connected'}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 text-xs">
                  {format(new Date(h.createdAt), 'MMM dd, yyyy')}
                </td>
              </tr>
            ))}
            {hospitals.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">No hospitals found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
