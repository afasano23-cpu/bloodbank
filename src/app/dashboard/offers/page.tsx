'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import OfferCard from '@/components/OfferCard'
import { Offer } from '@/types/offer'

type TabType = 'All' | 'Pending' | 'Accepted' | 'Rejected' | 'Expired'

export default function MyOffersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('All')
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      fetchOffers()
    }
  }, [status, router])

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const statusParam = activeTab === 'All' ? '' : `?status=${activeTab}`
      const res = await fetch(`/api/offers${statusParam}`)
      const data = await res.json()
      setOffers(data.offers || [])
    } catch (error) {
      console.error('Error fetching offers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOffers()
    }
  }, [activeTab])

  const handleCancel = async (offerId: string) => {
    if (confirmCancel !== offerId) {
      setConfirmCancel(offerId)
      setTimeout(() => setConfirmCancel(null), 3000)
      return
    }

    try {
      const res = await fetch(`/api/offers/${offerId}/cancel`, {
        method: 'POST'
      })

      if (res.ok) {
        fetchOffers()
        setConfirmCancel(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to cancel offer')
      }
    } catch (error) {
      console.error('Error cancelling offer:', error)
      alert('An error occurred while cancelling the offer')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  const tabs: TabType[] = ['All', 'Pending', 'Accepted', 'Rejected', 'Expired']

  const filteredOffers = activeTab === 'All'
    ? offers
    : offers.filter(offer => offer.status === activeTab)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            VetBlood Bank
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">My Offers</h2>
          <p className="text-gray-600 mt-2">
            View and manage offers you've made on blood listings
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const count = tab === 'All'
                  ? offers.length
                  : offers.filter(o => o.status === tab).length

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab
                        ? 'border-b-2 border-purple-600 text-purple-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab}
                    {count > 0 && (
                      <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {activeTab === 'All' ? 'No Offers Yet' : `No ${activeTab} Offers`}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'All'
                ? "You haven't made any offers yet. Browse the marketplace to get started."
                : `You don't have any ${activeTab.toLowerCase()} offers.`}
            </p>
            {activeTab === 'All' && (
              <Link
                href="/marketplace"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
              >
                Browse Marketplace
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                viewMode="buyer"
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Cancel */}
      {confirmCancel && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-4 shadow-lg max-w-sm">
          <p className="text-sm text-yellow-800 font-medium">
            Click "Cancel Offer" again to confirm cancellation
          </p>
        </div>
      )}
    </div>
  )
}
