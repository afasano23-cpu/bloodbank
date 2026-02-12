'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey && stripeKey !== '' ? loadStripe(stripeKey) : null
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

interface Listing {
  id: string
  animalType: string
  bloodType: string
  pricePerUnit: number
  hospital: {
    name: string
    address: string
  }
}

function CheckoutForm({ listing, quantity, clientSecret, orderId, demoMode, offerId }: {
  listing: Listing
  quantity: number
  clientSecret: string
  orderId: string
  demoMode: boolean
  offerId?: string | null
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError(null)

    // Demo mode - simulate payment
    if (demoMode) {
      setTimeout(async () => {
        // Confirm payment
        const res = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            paymentIntentId: clientSecret.replace('demo_secret_', 'demo_pi_')
          })
        })

        if (res.ok) {
          router.push(`/checkout/success?orderId=${orderId}&payment_intent=${clientSecret.replace('demo_secret_', 'demo_pi_')}`)
        } else {
          setError('Payment failed')
          setProcessing(false)
        }
      }, 1000)
      return
    }

    // Real Stripe payment
    if (!stripe || !elements) {
      return
    }

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`
      }
    })

    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setProcessing(false)
    }
  }

  const subtotal = listing.pricePerUnit * quantity
  const sellerFee = subtotal * 0.10  // 10% seller fee
  const buyerFee = subtotal * 0.10   // 10% buyer fee
  const sellerReceives = subtotal - sellerFee
  const total = subtotal + buyerFee

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {offerId && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <span className="text-sm text-purple-800 font-medium">
            ✨ Special Offer Price
          </span>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-gray-900">
            <span className="font-medium">{listing.animalType} - {listing.bloodType}</span>
            <span className="font-medium">{quantity} units</span>
          </div>
          <div className="flex justify-between text-sm text-gray-800">
            <span>Seller:</span>
            <span className="font-medium">{listing.hospital.name}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-800">
            <span>Seller receives:</span>
            <span className="font-medium text-green-600">${sellerReceives.toFixed(2)} (90%)</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-900">
            <span>Item Subtotal:</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-900">
            <span>Service Fee (10%):</span>
            <span className="font-semibold">${buyerFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-700">
            Platform fee: 10% from buyer + 10% from seller = 20% total platform revenue
          </p>
        </div>
      </div>

      {demoMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium">
            💡 Demo Mode: Click &quot;Pay&quot; to simulate a successful payment (no real payment required)
          </p>
        </div>
      )}

      {!demoMode && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Payment Information</h3>
          <PaymentElement />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-900 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={(!demoMode && !stripe) || processing}
        className="w-full bg-emerald-600 text-white py-3 px-6 rounded-md hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
      </button>

      <div className="text-center text-xs text-gray-500 mt-2">
        🔒 Secure payment powered by Stripe
      </div>
    </form>
  )
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const quantity = parseInt(searchParams.get('quantity') || '1')
  const offerId = searchParams.get('offerId')

  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      fetchListing()
    }
  }, [status, router])

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

  const initiateCheckout = async () => {
    if (!listing) return

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          quantity,
          ...(offerId && { offerId })
        })
      })

      const data = await res.json()
      setClientSecret(data.clientSecret)
      setOrderId(data.orderId)
      setDemoMode(data.demoMode || false)
    } catch (error) {
      console.error('Error initiating checkout:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-900">Loading...</div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-800">
            VetBlood Bank
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/marketplace/${listing.id}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Listing
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Checkout</h2>

          {!clientSecret ? (
            <>
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 font-medium">
                    This order is for self-pickup at the seller&apos;s location
                  </p>
                </div>
              </div>

              <button
                onClick={initiateCheckout}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Continue to Payment
              </button>
            </>
          ) : demoMode || !stripePromise ? (
            <CheckoutForm
              listing={listing}
              quantity={quantity}
              clientSecret={clientSecret}
              orderId={orderId!}
              demoMode={true}
              offerId={offerId}
            />
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                listing={listing}
                quantity={quantity}
                clientSecret={clientSecret}
                orderId={orderId!}
                demoMode={false}
                offerId={offerId}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}
