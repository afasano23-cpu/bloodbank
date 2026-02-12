import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendListingCreatedEmail } from '@/lib/email'

const listingSchema = z.object({
  animalType: z.enum(['Dog', 'Cat']),
  bloodType: z.string().min(1, 'Blood type is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  pricePerUnit: z.number().positive('Price must be positive'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  storageConditions: z.string().min(1, 'Storage conditions are required'),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listings } = await req.json()

    if (!Array.isArray(listings) || listings.length === 0) {
      return NextResponse.json({ error: 'Listings array is required' }, { status: 400 })
    }

    if (listings.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 listings per upload' }, { status: 400 })
    }

    const results: { row: number; success: boolean; error?: string; id?: string }[] = []
    const validListings: z.infer<typeof listingSchema>[] = []
    const validIndices: number[] = []

    // Validate each row
    for (let i = 0; i < listings.length; i++) {
      try {
        const validated = listingSchema.parse(listings[i])
        validListings.push(validated)
        validIndices.push(i)
      } catch (err) {
        const message = err instanceof z.ZodError
          ? err.issues.map(e => e.message).join(', ')
          : 'Validation failed'
        results.push({ row: i, success: false, error: message })
      }
    }

    // Bulk create valid listings in a transaction
    if (validListings.length > 0) {
      const created = await prisma.$transaction(
        validListings.map((listing) =>
          prisma.bloodListing.create({
            data: {
              ...listing,
              hospitalId: session.user.id,
              expirationDate: new Date(listing.expirationDate),
            },
          })
        )
      )

      const hospital = await prisma.hospital.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      })

      for (let i = 0; i < created.length; i++) {
        results.push({ row: validIndices[i], success: true, id: created[i].id })

        // Fire-and-forget emails
        if (hospital) {
          sendListingCreatedEmail({
            hospitalEmail: hospital.email,
            hospitalName: hospital.name,
            animalType: created[i].animalType,
            bloodType: created[i].bloodType,
            quantity: created[i].quantity,
            pricePerUnit: created[i].pricePerUnit,
            expirationDate: created[i].expirationDate.toISOString(),
          })
        }
      }
    }

    results.sort((a, b) => a.row - b.row)

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    return NextResponse.json({
      successCount,
      errorCount,
      total: listings.length,
      results,
    }, { status: 201 })
  } catch (error) {
    console.error('Error bulk creating listings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
