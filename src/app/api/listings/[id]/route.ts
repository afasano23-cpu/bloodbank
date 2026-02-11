import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const listingSchema = z.object({
  animalType: z.enum(['Dog', 'Cat']),
  bloodType: z.string().min(1, 'Blood type is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  pricePerUnit: z.number().positive('Price must be positive'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  storageConditions: z.string().min(1, 'Storage conditions are required'),
  notes: z.string().optional(),
  isActive: z.boolean().optional()
})

// GET single listing
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const listing = await prisma.bloodListing.findUnique({
      where: { id },
      include: {
        hospital: {
          select: {
            name: true,
            address: true,
            phoneNumber: true
          }
        }
      }
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update listing
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listing = await prisma.bloodListing.findUnique({
      where: { id }
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.hospitalId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = listingSchema.parse(body)

    // If deactivating listing, reject all pending offers
    if (validatedData.isActive === false && listing.isActive === true) {
      await prisma.offer.updateMany({
        where: {
          listingId: id,
          status: 'Pending'
        },
        data: {
          status: 'Rejected',
          rejectedAt: new Date()
        }
      })
    }

    const updatedListing = await prisma.bloodListing.update({
      where: { id },
      data: {
        ...validatedData,
        expirationDate: new Date(validatedData.expirationDate)
      },
      include: {
        hospital: {
          select: {
            name: true,
            address: true
          }
        }
      }
    })

    return NextResponse.json({ listing: updatedListing })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error' },
        { status: 400 }
      )
    }

    console.error('Error updating listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE listing
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listing = await prisma.bloodListing.findUnique({
      where: { id }
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.hospitalId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Reject all pending offers before deleting
    await prisma.offer.updateMany({
      where: {
        listingId: id,
        status: 'Pending'
      },
      data: {
        status: 'Rejected',
        rejectedAt: new Date()
      }
    })

    await prisma.bloodListing.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Listing deleted successfully' })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
