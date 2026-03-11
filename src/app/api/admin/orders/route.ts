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

    const statusFilter = req.nextUrl.searchParams.get('status') || ''

    const where: Record<string, unknown> = {}
    if (statusFilter) where.status = statusFilter

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
        items: {
          include: {
            listing: {
              select: { animalType: true, bloodType: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching admin orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
