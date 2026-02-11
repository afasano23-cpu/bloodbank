import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listingId, quantity, deliveryMethod } = await req.json()

    // Validate listing
    const listing = await prisma.bloodListing.findUnique({
      where: { id: listingId },
      include: { hospital: true }
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.quantity < quantity) {
      return NextResponse.json({ error: 'Insufficient quantity' }, { status: 400 })
    }

    if (listing.hospitalId === session.user.id) {
      return NextResponse.json({ error: 'Cannot purchase your own listing' }, { status: 400 })
    }

    // Calculate pricing
    const subtotal = listing.pricePerUnit * quantity
    const serviceFee = subtotal * 0.1
    const deliveryFee = deliveryMethod === 'Courier' ? 25 : 0 // Simple flat rate for now
    const total = subtotal + serviceFee + deliveryFee

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        listingId,
        buyerId: session.user.id,
        sellerId: listing.hospitalId,
        quantity: quantity.toString()
      }
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        buyerId: session.user.id,
        sellerId: listing.hospitalId,
        subtotal,
        serviceFee,
        deliveryFee,
        total,
        deliveryMethod,
        paymentIntentId: paymentIntent.id,
        items: {
          create: {
            listingId,
            quantity,
            pricePerUnit: listing.pricePerUnit
          }
        }
      }
    })

    // Create delivery record if courier is selected
    if (deliveryMethod === 'Courier') {
      const buyer = await prisma.hospital.findUnique({
        where: { id: session.user.id }
      })

      await prisma.delivery.create({
        data: {
          orderId: order.id,
          pickupAddress: listing.hospital.address,
          deliveryAddress: buyer!.address,
          distance: 10 // Would calculate based on actual addresses
        }
      })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
