'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DOG_BLOOD_TYPES = ['DEA 1.1+', 'DEA 1.1-', 'DEA 3', 'DEA 4', 'DEA 5', 'DEA 7']
const CAT_BLOOD_TYPES = ['Type A', 'Type B', 'Type AB']

export default function NewListingPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [animalType, setAnimalType] = useState<'Dog' | 'Cat'>('Dog')

  const bloodTypes = animalType === 'Dog' ? DOG_BLOOD_TYPES : CAT_BLOOD_TYPES

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      animalType,
      bloodType: formData.get('bloodType') as string,
      quantity: parseInt(formData.get('quantity') as string),
      pricePerUnit: parseFloat(formData.get('pricePerUnit') as string),
      expirationDate: formData.get('expirationDate') as string,
      storageConditions: formData.get('storageConditions') as string,
      notes: formData.get('notes') as string
    }

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Failed to create listing')
        setLoading(false)
        return
      }

      router.push('/dashboard/listings')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            VetBlood Bank
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/listings"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Listings
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
            Add New Blood Listing
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Animal Type
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setAnimalType('Dog')}
                  className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                    animalType === 'Dog'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Dog
                </button>
                <button
                  type="button"
                  onClick={() => setAnimalType('Cat')}
                  className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                    animalType === 'Cat'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cat
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 mb-1">
                Blood Type
              </label>
              <select
                id="bloodType"
                name="bloodType"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select blood type</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (units)
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Unit ($)
                </label>
                <input
                  type="number"
                  id="pricePerUnit"
                  name="pricePerUnit"
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                id="expirationDate"
                name="expirationDate"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="storageConditions" className="block text-sm font-medium text-gray-700 mb-1">
                Storage Conditions
              </label>
              <input
                type="text"
                id="storageConditions"
                name="storageConditions"
                required
                placeholder="e.g., Refrigerated at 2-6°C"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Any additional information about this blood product"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/dashboard/listings"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
