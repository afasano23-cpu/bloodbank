import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { expireOldOffers } from '@/lib/offers'
import { z } from 'zod'

const createOfferSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  offeredPrice: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be positive'),
  message: z.string().max(500, 'Message must be 500 characters or less').optional()
})

// POST - Create new offer
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Expire old offers first
    await expireOldOffers()

    const body = await req.json()
    const validatedData = createOfferSchema.parse(body)

    // Check if listing exists and is active
    const listing = await prisma.bloodListing.findUnique({
      where: { id: validatedData.listingId },
      include: { hospital: true }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (!listing.isActive) {
      return NextResponse.json(
        { error: 'Listing is not active' },
        { status: 400 }
      )
    }

    // Check if listing is expired
    if (new Date(listing.expirationDate) < new Date()) {
      return NextResponse.json(
        { error: 'Listing has expired' },
        { status: 400 }
      )
    }

    // Check if quantity is available
    if (validatedData.quantity > listing.quantity) {
      return NextResponse.json(
        { error: `Only ${listing.quantity} units available` },
        { status: 400 }
      )
    }

    // Cannot offer on own listing
    if (listing.hospitalId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot make an offer on your own listing' },
        { status: 400 }
      )
    }

    // Check for duplicate pending offer
    const existingOffer = await prisma.offer.findFirst({
      where: {
        listingId: validatedData.listingId,
        buyerId: session.user.id,
        status: 'Pending'
      }
    })

    if (existingOffer) {
      return NextResponse.json(
        { error: 'You already have a pending offer on this listing' },
        { status: 400 }
      )
    }

    // Create offer with 24 hour expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const offer = await prisma.offer.create({
      data: {
        listingId: validatedData.listingId,
        buyerId: session.user.id,
        offeredPrice: validatedData.offeredPrice,
        quantity: validatedData.quantity,
        message: validatedData.message,
        expiresAt,
        status: 'Pending'
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
      }
    })

    return NextResponse.json({ offer }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get buyer's offers
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

    const offers = await prisma.offer.findMany({
      where: {
        buyerId: session.user.id,
        ...(status && { status })
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ offers })
  } catch (error) {
    console.error('Error fetching offers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
