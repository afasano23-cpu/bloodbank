import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const animalType = req.nextUrl.searchParams.get('animalType') || ''
    const statusFilter = req.nextUrl.searchParams.get('status') || ''

    const where: Record<string, unknown> = {}
    if (animalType) where.animalType = animalType
    if (statusFilter === 'active') {
      where.isActive = true
      where.quantity = { gt: 0 }
    } else if (statusFilter === 'inactive') {
      where.isActive = false
    }

    const listings = await prisma.bloodListing.findMany({
      where,
      include: {
        hospital: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('Error fetching admin listings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
