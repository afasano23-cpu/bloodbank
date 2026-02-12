import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { haversineDistanceMiles } from '@/lib/haversine'
import { sendDailyDigestEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Fetch all hospitals with lat/lng
  const hospitals = await prisma.hospital.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      latitude: true,
      longitude: true,
    },
  })

  // 2. Fetch all active, non-expired listings with hospital info
  const listings = await prisma.bloodListing.findMany({
    where: {
      isActive: true,
      quantity: { gt: 0 },
      expirationDate: { gt: new Date() },
    },
    include: {
      hospital: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  })

  let emailsSent = 0

  // 3. For each hospital, find listings within 50 miles (excluding own)
  for (const hospital of hospitals) {
    if (!hospital.latitude || !hospital.longitude) continue

    const nearbyListings = listings
      .filter((l) => l.hospital.id !== hospital.id)
      .filter((l) => l.hospital.latitude && l.hospital.longitude)
      .map((l) => {
        const distance = haversineDistanceMiles(
          hospital.latitude!,
          hospital.longitude!,
          l.hospital.latitude!,
          l.hospital.longitude!
        )
        return { listing: l, distanceMiles: Math.round(distance * 10) / 10 }
      })
      .filter((entry) => entry.distanceMiles <= 50)
      .sort((a, b) => a.distanceMiles - b.distanceMiles)

    if (nearbyListings.length === 0) continue

    await sendDailyDigestEmail({
      hospitalEmail: hospital.email,
      hospitalName: hospital.name,
      listings: nearbyListings.map((entry) => ({
        hospitalName: entry.listing.hospital.name,
        animalType: entry.listing.animalType,
        bloodType: entry.listing.bloodType,
        quantity: entry.listing.quantity,
        pricePerUnit: entry.listing.pricePerUnit,
        distanceMiles: entry.distanceMiles,
      })),
    })

    emailsSent++
  }

  return NextResponse.json({
    success: true,
    emailsSent,
    hospitalCount: hospitals.length,
    listingCount: listings.length,
  })
}
