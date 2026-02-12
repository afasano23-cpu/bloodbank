import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe, isDemoMode } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listingId, quantity, offerId } = await req.json()

    // Validate listing
    const listing = await prisma.bloodListing.findUnique({
      where: { id: listingId },
      include: { hospital: true }
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    let pricePerUnit = listing.pricePerUnit
    let finalQuantity = quantity

    // If offerId provided, use accepted offer price
    if (offerId) {
      const offer = await prisma.offer.findUnique({
        where: { id: offerId }
      })

      if (offer && offer.status === 'Accepted' && offer.buyerId === session.user.id) {
        pricePerUnit = offer.offeredPrice
        finalQuantity = offer.quantity
      }
    }

    if (listing.quantity < finalQuantity) {
      return NextResponse.json({ error: 'Insufficient quantity' }, { status: 400 })
    }

    if (listing.hospitalId === session.user.id) {
      return NextResponse.json({ error: 'Cannot purchase your own listing' }, { status: 400 })
    }

    // Calculate pricing with fees from both sides (10% each)
    const subtotal = pricePerUnit * finalQuantity
    const sellerFee = subtotal * 0.10  // 10% from seller (they receive 90%)
    const buyerFee = subtotal * 0.10   // 10% from buyer
    const sellerReceives = subtotal - sellerFee  // Seller gets 90%
    const total = subtotal + buyerFee  // Buyer pays listing price + 10%

    let paymentIntentId = null
    let clientSecret = null

    // Only use Stripe if not in demo mode and keys are configured
    const stripe = getStripe()
    if (stripe) {
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(total * 100),
        currency: 'usd',
        metadata: {
          listingId,
          buyerId: session.user.id,
          sellerId: listing.hospitalId,
          quantity: finalQuantity.toString(),
          ...(offerId && { offerId })
        }
      }

      // If seller has connected Stripe account, split the payment
      const sellerStripeAccountId = listing.hospital.stripeAccountId
      if (sellerStripeAccountId) {
        const platformFee = Math.round((sellerFee + buyerFee) * 100)
        paymentIntentParams.application_fee_amount = platformFee
        paymentIntentParams.transfer_data = {
          destination: sellerStripeAccountId
        }
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

      paymentIntentId = paymentIntent.id
      clientSecret = paymentIntent.client_secret
    } else {
      // Demo mode - generate fake payment intent
      paymentIntentId = `demo_pi_${Date.now()}`
      clientSecret = `demo_secret_${Date.now()}`
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        buyerId: session.user.id,
        sellerId: listing.hospitalId,
        subtotal,
        serviceFee: sellerFee + buyerFee,  // Total platform fee (20%)
        deliveryFee: 0,
        total,
        deliveryMethod: 'Self-pickup',
        paymentIntentId,
        items: {
          create: {
            listingId,
            quantity: finalQuantity,
            pricePerUnit
          }
        }
      }
    })

    return NextResponse.json({
      clientSecret,
      orderId: order.id,
      demoMode: isDemoMode
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
