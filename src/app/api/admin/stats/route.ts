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
      totalCouriers
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          serviceFee: true
        }
      }),
      prisma.bloodListing.count({
        where: {
          isActive: true,
          quantity: { gt: 0 }
        }
      }),
      prisma.hospital.count(),
      prisma.courier.count()
    ])

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        buyer: {
          select: {
            name: true
          }
        },
        seller: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum.serviceFee || 0,
        activeListings,
        totalHospitals,
        totalCouriers
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
