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
  notes: z.string().optional()
})

// GET all listings for the logged-in hospital
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listings = await prisma.bloodListing.findMany({
      where: {
        hospitalId: session.user.id
      },
      include: {
        hospital: {
          select: {
            name: true,
            address: true
          }
        },
        _count: {
          select: {
            offers: {
              where: {
                status: 'Pending'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a new listing
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = listingSchema.parse(body)

    const listing = await prisma.bloodListing.create({
      data: {
        ...validatedData,
        hospitalId: session.user.id,
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

    return NextResponse.json({ listing }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error' },
        { status: 400 }
      )
    }

    console.error('Error creating listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
