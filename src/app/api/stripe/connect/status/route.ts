import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe, isDemoMode } from '@/lib/stripe'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true }
    })

    if (!hospital?.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false
      })
    }

    if (isDemoMode || hospital.stripeAccountId.startsWith('demo_acct_')) {
      return NextResponse.json({
        connected: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        demoMode: true
      })
    }

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const account = await stripe.accounts.retrieve(hospital.stripeAccountId)

    return NextResponse.json({
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted
    })
  } catch (error) {
    console.error('Error checking Stripe Connect status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
