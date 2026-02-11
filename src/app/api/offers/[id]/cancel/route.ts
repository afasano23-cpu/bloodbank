import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Buyer cancels their pending offer
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch offer
    const offer = await prisma.offer.findUnique({
      where: { id: params.id }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    // Verify user is the buyer
    if (offer.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the buyer can cancel this offer' },
        { status: 403 }
      )
    }

    // Verify offer is pending
    if (offer.status !== 'Pending') {
      return NextResponse.json(
        { error: `Cannot cancel ${offer.status.toLowerCase()} offer` },
        { status: 400 }
      )
    }

    // Cancel the offer
    const cancelledOffer = await prisma.offer.update({
      where: { id: params.id },
      data: { status: 'Cancelled' }
    })

    return NextResponse.json({
      message: 'Offer cancelled successfully',
      offer: cancelledOffer
    })
  } catch (error) {
    console.error('Error cancelling offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
