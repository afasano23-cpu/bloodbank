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

    const search = req.nextUrl.searchParams.get('search') || ''

    const hospitals = await prisma.hospital.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        phoneNumber: true,
        stripeAccountId: true,
        createdAt: true,
        _count: {
          select: {
            bloodListings: true,
            purchaseOrders: true,
            saleOrders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ hospitals })
  } catch (error) {
    console.error('Error fetching hospitals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
