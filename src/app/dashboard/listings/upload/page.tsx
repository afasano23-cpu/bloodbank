'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Papa from 'papaparse'

interface ParsedRow {
  animalType: string
  bloodType: string
  quantity: number
  pricePerUnit: number
  expirationDate: string
  storageConditions: string
  notes?: string
  _error?: string
}

const VALID_ANIMAL_TYPES = ['Dog', 'Cat']
const VALID_DOG_BLOOD_TYPES = ['DEA 1.1+', 'DEA 1.1-', 'DEA 1.2+', 'DEA 1.2-', 'DEA 3', 'DEA 4', 'DEA 5', 'DEA 7']
const VALID_CAT_BLOOD_TYPES = ['Type A', 'Type B', 'Type AB']

function validateRow(row: Record<string, string>): ParsedRow {
  const errors: string[] = []

  const animalType = row.animalType?.trim() || ''
  if (!VALID_ANIMAL_TYPES.includes(animalType)) {
    errors.push('Invalid animal type (must be Dog or Cat)')
  }

  const bloodType = row.bloodType?.trim() || ''
  if (!bloodType) {
    errors.push('Blood type is required')
  } else if (animalType === 'Dog' && !VALID_DOG_BLOOD_TYPES.includes(bloodType)) {
    errors.push(`Invalid dog blood type`)
  } else if (animalType === 'Cat' && !VALID_CAT_BLOOD_TYPES.includes(bloodType)) {
    errors.push(`Invalid cat blood type`)
  }

  const quantity = parseInt(row.quantity)
  if (isNaN(quantity) || quantity <= 0) {
    errors.push('Quantity must be a positive integer')
  }

  const pricePerUnit = parseFloat(row.pricePerUnit)
  if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
    errors.push('Price must be a positive number')
  }

  const expirationDate = row.expirationDate?.trim() || ''
  if (!expirationDate || isNaN(Date.parse(expirationDate))) {
    errors.push('Valid expiration date is required')
  } else if (new Date(expirationDate) <= new Date()) {
    errors.push('Expiration date must be in the future')
  }

  const storageConditions = row.storageConditions?.trim() || ''
  if (!storageConditions) {
    errors.push('Storage conditions are required')
  }

  return {
    animalType,
    bloodType,
    quantity: quantity || 0,
    pricePerUnit: pricePerUnit || 0,
    expirationDate,
    storageConditions,
    notes: row.notes?.trim() || undefined,
    _error: errors.length > 0 ? errors.join('; ') : undefined,
  }
}

export default function UploadCSVPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ successCount: number; errorCount: number; total: number } | null>(null)
  const [parseError, setParseError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError('')
    setResult(null)
    setRows([])

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(`CSV parsing error: ${results.errors[0].message}`)
          return
        }
        if (results.data.length === 0) {
          setParseError('CSV file is empty')
          return
        }
        if (results.data.length > 100) {
          setParseError('Maximum 100 rows per upload')
          return
        }
        const parsed = (results.data as Record<string, string>[]).map(validateRow)
        setRows(parsed)
      },
      error: (error) => {
        setParseError(`Failed to parse CSV: ${error.message}`)
      },
    })
  }

  const validRows = rows.filter(r => !r._error)
  const invalidRows = rows.filter(r => r._error)

  const handleUpload = async () => {
    if (validRows.length === 0) return

    setUploading(true)
    setResult(null)

    try {
      const listings = validRows.map(({ _error, ...row }) => row)
      const res = await fetch('/api/listings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listings }),
      })

      const data = await res.json()

      if (!res.ok) {
        setParseError(data.error || 'Upload failed')
        return
      }

      setResult({ successCount: data.successCount, errorCount: data.errorCount, total: data.total })
    } catch {
      setParseError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            VetBlood Bank
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/listings" className="text-gray-600 hover:text-gray-800">
            &larr; Back to Listings
          </Link>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Upload CSV</h2>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">CSV Format</h3>
          <p className="text-sm text-gray-600 mb-3">
            Your CSV file should have the following columns:
          </p>
          <div className="bg-gray-50 rounded-md p-3 overflow-x-auto">
            <code className="text-xs text-gray-700">
              animalType,bloodType,quantity,pricePerUnit,expirationDate,storageConditions,notes<br/>
              Dog,DEA 1.1+,10,150.00,2026-06-15,Refrigerated at 2-6&deg;C,Fresh whole blood<br/>
              Cat,Type A,5,200.00,2026-05-01,Refrigerated at 2-6&deg;C,
            </code>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <p><strong>Animal Types:</strong> Dog, Cat</p>
            <p><strong>Dog Blood Types:</strong> DEA 1.1+, DEA 1.1-, DEA 1.2+, DEA 1.2-, DEA 3, DEA 4, DEA 5, DEA 7</p>
            <p><strong>Cat Blood Types:</strong> Type A, Type B, Type AB</p>
          </div>
        </div>

        {/* File Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {parseError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {parseError}
          </div>
        )}

        {result && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-semibold">
              Upload complete: {result.successCount} of {result.total} listings created successfully.
            </p>
            {result.errorCount > 0 && (
              <p className="text-yellow-700 mt-1">{result.errorCount} rows had errors and were skipped.</p>
            )}
            <Link href="/dashboard/listings" className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
              View your listings &rarr;
            </Link>
          </div>
        )}

        {/* Preview Table */}
        {rows.length > 0 && !result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">
                Preview ({rows.length} rows &mdash; {validRows.length} valid, {invalidRows.length} with errors)
              </h3>
              <button
                onClick={handleUpload}
                disabled={uploading || validRows.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {uploading ? 'Uploading...' : `Upload ${validRows.length} Valid Listings`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">#</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Animal</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Blood Type</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Qty</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Price</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Expires</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Storage</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b ${row._error ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                      <td className="py-2 px-3 text-gray-900">{row.animalType}</td>
                      <td className="py-2 px-3 text-gray-900">{row.bloodType}</td>
                      <td className="py-2 px-3 text-gray-900">{row.quantity}</td>
                      <td className="py-2 px-3 text-gray-900">${row.pricePerUnit.toFixed(2)}</td>
                      <td className="py-2 px-3 text-gray-900">{row.expirationDate}</td>
                      <td className="py-2 px-3 text-gray-900">{row.storageConditions}</td>
                      <td className="py-2 px-3">
                        {row._error ? (
                          <span className="text-red-600 text-xs">{row._error}</span>
                        ) : (
                          <span className="text-green-600 text-xs font-medium">Valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
