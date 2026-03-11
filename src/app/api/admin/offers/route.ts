import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { expireOldOffers } from '@/lib/offers'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Expire old offers first
    await expireOldOffers()

    const statusFilter = req.nextUrl.searchParams.get('status') || ''

    const where: Record<string, unknown> = {}
    if (statusFilter) where.status = statusFilter

    const [offers, statusCounts] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          buyer: { select: { name: true } },
          listing: {
            select: {
              animalType: true,
              bloodType: true,
              pricePerUnit: true,
              hospital: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.offer.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

    const counts: Record<string, number> = {
      Pending: 0,
      Accepted: 0,
      Rejected: 0,
      Expired: 0,
      Cancelled: 0,
    }
    for (const sc of statusCounts) {
      counts[sc.status] = sc._count
    }

    return NextResponse.json({ offers, statusCounts: counts })
  } catch (error) {
    console.error('Error fetching admin offers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
