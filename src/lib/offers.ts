import prisma from '@/lib/prisma'

/**
 * Expires old offers that have passed their expiration date
 * Should be called before fetching offers in API routes
 * @returns Number of offers expired
 */
export async function expireOldOffers() {
  const result = await prisma.offer.updateMany({
    where: {
      status: 'Pending',
      expiresAt: { lt: new Date() }
    },
    data: { status: 'Expired' }
  })
  return result.count
}

/**
 * Calculates time remaining until offer expires
 * @param expiresAt - Expiration date
 * @returns Human-readable time remaining (e.g. "23h 45m")
 */
export function getTimeRemaining(expiresAt: Date | string): string {
  const expires = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  const now = new Date()
  const diff = expires.getTime() - now.getTime()

  if (diff <= 0) return 'Expired'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Calculates order totals including fees
 * @param quantity - Number of units
 * @param pricePerUnit - Price per unit
 * @returns Object with subtotal, service fee, and total
 */
export function calculateOfferTotals(quantity: number, pricePerUnit: number) {
  const subtotal = quantity * pricePerUnit
  const serviceFee = subtotal * 0.10 // 10% buyer fee
  const total = subtotal + serviceFee

  return {
    subtotal: Number(subtotal.toFixed(2)),
    serviceFee: Number(serviceFee.toFixed(2)),
    total: Number(total.toFixed(2))
  }
}
