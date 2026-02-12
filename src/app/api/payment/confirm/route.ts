import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { sendPaymentConfirmedEmail } from '@/lib/email'

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

async function notifyPaymentParticipants(order: { id: string; buyerId: string; sellerId: string; total: number; items: Array<{ listingId: string; quantity: number; pricePerUnit: number }> }) {
  const [buyer, seller] = await Promise.all([
    prisma.hospital.findUnique({ where: { id: order.buyerId }, select: { email: true, name: true } }),
    prisma.hospital.findUnique({ where: { id: order.sellerId }, select: { email: true, name: true } }),
  ])

  const itemsWithListings = await Promise.all(
    order.items.map(async (item) => {
      const listing = await prisma.bloodListing.findUnique({
        where: { id: item.listingId },
        select: { animalType: true, bloodType: true }
      })
      return {
        animalType: listing?.animalType || 'Unknown',
        bloodType: listing?.bloodType || 'Unknown',
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
      }
    })
  )

  if (buyer) {
    sendPaymentConfirmedEmail({
      email: buyer.email, name: buyer.name, role: 'buyer',
      orderId: order.id, total: order.total, items: itemsWithListings,
    })
  }
  if (seller) {
    sendPaymentConfirmedEmail({
      email: seller.email, name: seller.name, role: 'seller',
      orderId: order.id, total: order.total, items: itemsWithListings,
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, paymentIntentId } = await req.json()

    // In demo mode, skip Stripe verification
    if (isDemoMode || paymentIntentId.startsWith('demo_pi_')) {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'Paid', status: 'Confirmed' },
        include: { items: true }
      })

      for (const item of order.items) {
        await prisma.bloodListing.update({
          where: { id: item.listingId },
          data: { quantity: { decrement: item.quantity } }
        })
      }

      notifyPaymentParticipants(order)
      return NextResponse.json({ success: true, order })
    }

    // Real Stripe payment verification
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === '') {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover' as Stripe.LatestApiVersion
    })

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'Paid', status: 'Confirmed' },
      include: { items: true }
    })

    for (const item of order.items) {
      await prisma.bloodListing.update({
        where: { id: item.listingId },
        data: { quantity: { decrement: item.quantity } }
      })
    }

    notifyPaymentParticipants(order)
    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
