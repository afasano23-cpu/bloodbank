import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, paymentIntentId } = await req.json()

    // In demo mode, skip Stripe verification
    if (isDemoMode || paymentIntentId.startsWith('demo_pi_')) {
      // Update order directly
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'Paid',
          status: 'Confirmed'
        },
        include: {
          items: true
        }
      })

      // Update listing quantity
      for (const item of order.items) {
        await prisma.bloodListing.update({
          where: { id: item.listingId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        })
      }

      return NextResponse.json({ success: true, order })
    }

    // Real Stripe payment verification
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === '') {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover'
    })

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Update order
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'Paid',
        status: 'Confirmed'
      },
      include: {
        items: true
      }
    })

    // Update listing quantity
    for (const item of order.items) {
      await prisma.bloodListing.update({
        where: { id: item.listingId },
        data: {
          quantity: {
            decrement: item.quantity
          }
        }
      })
    }

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
