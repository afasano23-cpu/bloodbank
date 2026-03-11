import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentStatus = searchParams.get('paymentStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const exportCsv = searchParams.get('export') === 'csv'

    const where: Record<string, unknown> = {}

    if (startDate) {
      where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(startDate) }
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { ...(where.createdAt as object || {}), lte: end }
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    const [orders, totalCount, aggregations] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          buyer: { select: { name: true } },
          seller: { select: { name: true } },
          items: {
            include: {
              listing: {
                select: { animalType: true, bloodType: true }
              }
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        ...(exportCsv ? {} : { skip: (page - 1) * limit, take: limit }),
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { total: true, serviceFee: true, subtotal: true },
        _count: true,
      }),
    ])

    const transactions = orders.map(order => {
      const sellerFee = order.subtotal * 0.10
      const buyerFee = order.subtotal * 0.10
      return {
        id: order.id,
        subtotal: order.subtotal,
        serviceFee: order.serviceFee,
        total: order.total,
        buyerFee,
        sellerFee,
        sellerReceives: order.subtotal - sellerFee,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentIntentId: order.paymentIntentId,
        createdAt: order.createdAt,
        buyer: order.buyer,
        seller: order.seller,
        items: order.items,
      }
    })

    if (exportCsv) {
      const csvData = transactions.map(t => ({
        'Order ID': t.id,
        'Date': new Date(t.createdAt).toISOString().split('T')[0],
        'Buyer': t.buyer.name,
        'Seller': t.seller.name,
        'Subtotal': t.subtotal.toFixed(2),
        'Buyer Fee (10%)': t.buyerFee.toFixed(2),
        'Seller Fee (10%)': t.sellerFee.toFixed(2),
        'Platform Revenue (20%)': t.serviceFee.toFixed(2),
        'Seller Receives': t.sellerReceives.toFixed(2),
        'Total Charged': t.total.toFixed(2),
        'Status': t.status,
        'Payment Status': t.paymentStatus,
        'Payment Intent': t.paymentIntentId || '',
      }))

      const csv = Papa.unparse(csvData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({
      transactions,
      summary: {
        totalVolume: aggregations._sum.total || 0,
        totalPlatformFees: aggregations._sum.serviceFee || 0,
        totalTransactions: aggregations._count,
        avgTransactionValue: aggregations._count > 0
          ? (aggregations._sum.total || 0) / aggregations._count
          : 0,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching admin transactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
