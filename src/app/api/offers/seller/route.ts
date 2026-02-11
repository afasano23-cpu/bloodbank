import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { expireOldOffers } from '@/lib/offers'

// GET - Get all offers on seller's listings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Expire old offers first
    await expireOldOffers()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const listingId = searchParams.get('listingId')

    const offers = await prisma.offer.findMany({
      where: {
        listing: {
          hospitalId: session.user.id
        },
        ...(status && { status }),
        ...(listingId && { listingId })
      },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ offers })
  } catch (error) {
    console.error('Error fetching seller offers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
