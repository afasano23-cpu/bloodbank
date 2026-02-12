import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email, userType } = await req.json()

    if (!email || !userType) {
      return NextResponse.json({ error: 'Email and user type are required' }, { status: 400 })
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: 'If an account with that email exists, a reset link has been sent.'
    })

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}&type=${userType}`

    if (userType === 'hospital') {
      const hospital = await prisma.hospital.findUnique({ where: { email } })
      if (!hospital) return successResponse

      await prisma.hospital.update({
        where: { email },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expires,
        },
      })

      sendPasswordResetEmail({
        email: hospital.email,
        name: hospital.name,
        resetUrl,
      })
    } else if (userType === 'admin') {
      const admin = await prisma.admin.findUnique({ where: { email } })
      if (!admin) return successResponse

      await prisma.admin.update({
        where: { email },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expires,
        },
      })

      sendPasswordResetEmail({
        email: admin.email,
        name: admin.name,
        resetUrl,
      })
    }

    return successResponse
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
