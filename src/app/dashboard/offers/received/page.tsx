'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import OfferCard from '@/components/OfferCard'
import { Offer } from '@/types/offer'

type TabType = 'Pending' | 'Accepted' | 'Rejected' | 'All'

export default function OffersReceivedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('Pending')
  const [confirmAction, setConfirmAction] = useState<{ offerId: string; action: 'accept' | 'reject' } | null>(null)
  const [processingOffer, setProcessingOffer] = useState<string | null>(null)

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
      const res = await fetch(`/api/offers/seller${statusParam}`)
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

  const handleAccept = async (offerId: string) => {
    if (confirmAction?.offerId !== offerId || confirmAction.action !== 'accept') {
      setConfirmAction({ offerId, action: 'accept' })
      setTimeout(() => setConfirmAction(null), 5000)
      return
    }

    setProcessingOffer(offerId)
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      })

      const data = await res.json()

      if (res.ok) {
        // Success - show confirmation and redirect buyer to checkout
        alert('Offer accepted! The buyer will be redirected to checkout.')
        fetchOffers()
        setConfirmAction(null)
      } else {
        alert(data.error || 'Failed to accept offer')
      }
    } catch (error) {
      console.error('Error accepting offer:', error)
      alert('An error occurred while accepting the offer')
    } finally {
      setProcessingOffer(null)
    }
  }

  const handleReject = async (offerId: string) => {
    if (confirmAction?.offerId !== offerId || confirmAction.action !== 'reject') {
      setConfirmAction({ offerId, action: 'reject' })
      setTimeout(() => setConfirmAction(null), 5000)
      return
    }

    setProcessingOffer(offerId)
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      })

      if (res.ok) {
        fetchOffers()
        setConfirmAction(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to reject offer')
      }
    } catch (error) {
      console.error('Error rejecting offer:', error)
      alert('An error occurred while rejecting the offer')
    } finally {
      setProcessingOffer(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  const tabs: TabType[] = ['Pending', 'Accepted', 'Rejected', 'All']

  const filteredOffers = activeTab === 'All'
    ? offers
    : offers.filter(offer => offer.status === activeTab)

  const pendingCount = offers.filter(o => o.status === 'Pending').length

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
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-gray-800">Offers Received</h2>
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                {pendingCount} pending
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-2">
            Review and respond to offers from buyers
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
                        ? 'border-b-2 border-emerald-600 text-emerald-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab}
                    {count > 0 && (
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          tab === 'Pending'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
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
            <div className="text-6xl mb-4">📬</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {activeTab === 'All' ? 'No Offers Yet' : `No ${activeTab} Offers`}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'Pending'
                ? 'No pending offers at the moment.'
                : `You don't have any ${activeTab.toLowerCase()} offers.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOffers.map((offer) => (
              <div key={offer.id}>
                <OfferCard
                  offer={offer}
                  viewMode="seller"
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
                {processingOffer === offer.id && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">Processing...</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-4 shadow-lg max-w-sm">
          <p className="text-sm text-yellow-800 font-medium">
            Click "{confirmAction.action === 'accept' ? 'Accept Offer' : 'Reject'}" again to confirm
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            {confirmAction.action === 'accept'
              ? 'This will create an order and redirect the buyer to checkout.'
              : 'This action cannot be undone.'}
          </p>
        </div>
      )}
    </div>
  )
}
