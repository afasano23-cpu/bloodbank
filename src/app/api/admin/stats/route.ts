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

    const [
      totalOrders,
      totalRevenue,
      activeListings,
      totalHospitals,
      totalOffers,
      pendingOffers,
      avgOrder,
      acceptedOffers,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { serviceFee: true }
      }),
      prisma.bloodListing.count({
        where: { isActive: true, quantity: { gt: 0 } }
      }),
      prisma.hospital.count(),
      prisma.offer.count(),
      prisma.offer.count({ where: { status: 'Pending' } }),
      prisma.order.aggregate({ _avg: { total: true } }),
      prisma.offer.count({ where: { status: 'Accepted' } }),
    ])

    // Revenue by month (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        paymentStatus: 'Paid',
      },
      select: {
        serviceFee: true,
        createdAt: true,
      },
    })

    const revenueByMonth: Record<string, number> = {}
    for (const order of monthlyOrders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth[key] = (revenueByMonth[key] || 0) + order.serviceFee
    }

    // Month-over-month revenue growth
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`
    const thisMonthRev = revenueByMonth[thisMonth] || 0
    const lastMonthRev = revenueByMonth[lastMonth] || 0
    const revenueGrowth = lastMonthRev > 0
      ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100
      : 0

    // Offer-to-order conversion rate
    const offerConversionRate = totalOffers > 0
      ? (acceptedOffers / totalOffers) * 100
      : 0

    // Top 5 hospitals by volume (as sellers)
    const topHospitalsRaw = await prisma.order.groupBy({
      by: ['sellerId'],
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    })

    const topHospitalIds = topHospitalsRaw.map(h => h.sellerId)
    const hospitalNames = await prisma.hospital.findMany({
      where: { id: { in: topHospitalIds } },
      select: { id: true, name: true },
    })
    const nameMap = new Map(hospitalNames.map(h => [h.id, h.name]))

    const topHospitals = topHospitalsRaw.map(h => ({
      id: h.sellerId,
      name: nameMap.get(h.sellerId) || 'Unknown',
      orderCount: h._count,
      totalVolume: h._sum.total || 0,
    }))

    // Blood type demand distribution (from order items)
    const bloodDemandRaw = await prisma.orderItem.groupBy({
      by: ['listingId'],
      _count: true,
    })

    const listingIds = bloodDemandRaw.map(d => d.listingId)
    const listingDetails = await prisma.bloodListing.findMany({
      where: { id: { in: listingIds } },
      select: { id: true, animalType: true, bloodType: true },
    })
    const listingMap = new Map(listingDetails.map(l => [l.id, l]))

    const demandAgg: Record<string, { animalType: string; bloodType: string; count: number }> = {}
    for (const item of bloodDemandRaw) {
      const listing = listingMap.get(item.listingId)
      if (!listing) continue
      const key = `${listing.animalType}-${listing.bloodType}`
      if (!demandAgg[key]) {
        demandAgg[key] = { animalType: listing.animalType, bloodType: listing.bloodType, count: 0 }
      }
      demandAgg[key].count += item._count
    }
    const bloodDemand = Object.values(demandAgg).sort((a, b) => b.count - a.count)

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
      }
    })

    return NextResponse.json({
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum.serviceFee || 0,
        activeListings,
        totalHospitals,
        totalOffers,
        pendingOffers,
        revenueByMonth,
        avgOrderValue: avgOrder._avg.total || 0,
        offerConversionRate,
        revenueGrowth,
        topHospitals,
        bloodDemand,
      },
      recentOrders
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
