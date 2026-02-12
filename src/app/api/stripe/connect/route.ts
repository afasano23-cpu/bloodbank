import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe, isDemoMode } from '@/lib/stripe'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stripe = getStripe()

    if (!stripe) {
      if (isDemoMode) {
        await prisma.hospital.update({
          where: { id: session.user.id },
          data: { stripeAccountId: `demo_acct_${Date.now()}` }
        })
        return NextResponse.json({
          url: '/dashboard/settings?stripe=connected',
          demoMode: true
        })
      }
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const hospital = await prisma.hospital.findUnique({
      where: { id: session.user.id }
    })

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    let accountId = hospital.stripeAccountId

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: hospital.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        business_type: 'company',
        metadata: {
          hospitalId: hospital.id
        }
      })
      accountId = account.id

      await prisma.hospital.update({
        where: { id: hospital.id },
        data: { stripeAccountId: accountId }
      })
    }

    const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/api/stripe/connect/callback?refresh=true`,
      return_url: `${origin}/api/stripe/connect/callback?account_id=${accountId}`,
      type: 'account_onboarding'
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
