import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { expireOldOffers } from '@/lib/offers'
import { getStripe, isDemoMode } from '@/lib/stripe'
import Stripe from 'stripe'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['accept', 'reject'])
})

// GET - Get single offer details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await expireOldOffers()

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            hospital: {
              select: {
                id: true,
                name: true,
                address: true,
                email: true,
                phoneNumber: true
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            address: true
          }
        }
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    // Check if user is buyer or seller
    const isBuyer = offer.buyerId === session.user.id
    const isSeller = offer.listing.hospitalId === session.user.id

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ offer })
  } catch (error) {
    console.error('Error fetching offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Accept or reject offer
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await expireOldOffers()

    const body = await req.json()
    const { action } = actionSchema.parse(body)

    // Fetch offer with listing
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        listing: true,
        buyer: true
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    // Verify user owns the listing (is the seller)
    if (offer.listing.hospitalId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the seller can accept or reject offers' },
        { status: 403 }
      )
    }

    // Verify offer is pending
    if (offer.status !== 'Pending') {
      return NextResponse.json(
        { error: `Offer is already ${offer.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Verify offer not expired
    if (new Date(offer.expiresAt) < new Date()) {
      await prisma.offer.update({
        where: { id: id },
        data: { status: 'Expired' }
      })
      return NextResponse.json(
        { error: 'Offer has expired' },
        { status: 400 }
      )
    }

    // Verify listing still active
    if (!offer.listing.isActive) {
      return NextResponse.json(
        { error: 'Listing is no longer active' },
        { status: 400 }
      )
    }

    // Handle rejection
    if (action === 'reject') {
      const rejectedOffer = await prisma.offer.update({
        where: { id: id },
        data: {
          status: 'Rejected',
          rejectedAt: new Date()
        }
      })

      return NextResponse.json({
        message: 'Offer rejected',
        offer: rejectedOffer
      })
    }

    // Handle acceptance with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify quantity still available
      const currentListing = await tx.bloodListing.findUnique({
        where: { id: offer.listingId }
      })

      if (!currentListing || offer.quantity > currentListing.quantity) {
        throw new Error('Insufficient quantity available')
      }

      // 1. Update this offer to Accepted
      const acceptedOffer = await tx.offer.update({
        where: { id: id },
        data: {
          status: 'Accepted',
          acceptedAt: new Date()
        }
      })

      // 2. Reject all other pending offers on this listing
      await tx.offer.updateMany({
        where: {
          listingId: offer.listingId,
          id: { not: id },
          status: 'Pending'
        },
        data: {
          status: 'Rejected',
          rejectedAt: new Date()
        }
      })

      // 3. Calculate pricing with fees
      const subtotal = offer.offeredPrice * offer.quantity
      const sellerFee = subtotal * 0.10  // 10% from seller
      const buyerFee = subtotal * 0.10   // 10% from buyer
      const total = subtotal + buyerFee

      let paymentIntentId = null
      let clientSecret = null

      // 4. Create Stripe payment intent
      const stripe = getStripe()
      if (stripe) {
        // Look up seller's Stripe Connect account
        const seller = await prisma.hospital.findUnique({
          where: { id: session.user.id },
          select: { stripeAccountId: true }
        })

        const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
          amount: Math.round(total * 100),
          currency: 'usd',
          metadata: {
            offerId: acceptedOffer.id,
            listingId: offer.listingId,
            buyerId: offer.buyerId,
            sellerId: session.user.id,
            quantity: offer.quantity.toString()
          }
        }

        // If seller has connected Stripe account, split the payment
        if (seller?.stripeAccountId) {
          const platformFee = Math.round((sellerFee + buyerFee) * 100)
          paymentIntentParams.application_fee_amount = platformFee
          paymentIntentParams.transfer_data = {
            destination: seller.stripeAccountId
          }
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

        paymentIntentId = paymentIntent.id
        clientSecret = paymentIntent.client_secret
      } else {
        // Demo mode
        paymentIntentId = `demo_pi_${Date.now()}`
        clientSecret = `demo_secret_${Date.now()}`
      }

      // 5. Create order
      const order = await tx.order.create({
        data: {
          buyerId: offer.buyerId,
          sellerId: session.user.id,
          subtotal,
          serviceFee: sellerFee + buyerFee,  // Total platform fee (20%)
          deliveryFee: 0,
          total,
          deliveryMethod: 'Self-pickup',
          paymentIntentId,
          items: {
            create: {
              listingId: offer.listingId,
              quantity: offer.quantity,
              pricePerUnit: offer.offeredPrice
            }
          }
        }
      })

      return {
        orderId: order.id,
        clientSecret,
        offerId: acceptedOffer.id,
        demoMode: isDemoMode
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "reject"' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'Insufficient quantity available') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Error processing offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
