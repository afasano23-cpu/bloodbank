import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'hospital') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const animalType = searchParams.get('animalType')
    const bloodType = searchParams.get('bloodType')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sortBy = searchParams.get('sortBy') || 'createdAt'

    const where: any = {
      isActive: true,
      quantity: { gt: 0 },
      expirationDate: { gte: new Date() },
      hospitalId: { not: session.user.id } // Exclude own listings
    }

    if (animalType) {
      where.animalType = animalType
    }

    if (bloodType) {
      where.bloodType = bloodType
    }

    if (minPrice || maxPrice) {
      where.pricePerUnit = {}
      if (minPrice) {
        where.pricePerUnit.gte = parseFloat(minPrice)
      }
      if (maxPrice) {
        where.pricePerUnit.lte = parseFloat(maxPrice)
      }
    }

    let orderBy: any = {}
    switch (sortBy) {
      case 'price_asc':
        orderBy = { pricePerUnit: 'asc' }
        break
      case 'price_desc':
        orderBy = { pricePerUnit: 'desc' }
        break
      case 'expiration':
        orderBy = { expirationDate: 'asc' }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    const listings = await prisma.bloodListing.findMany({
      where,
      include: {
        hospital: {
          select: {
            name: true,
            address: true
          }
        }
      },
      orderBy
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('Error fetching marketplace listings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
