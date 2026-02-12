import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token, email, userType, password } = await req.json()

    if (!token || !email || !userType || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const hashedPassword = await bcrypt.hash(password, 10)

    if (userType === 'hospital') {
      const hospital = await prisma.hospital.findFirst({
        where: {
          email,
          passwordResetToken: hashedToken,
          passwordResetExpires: { gt: new Date() },
        },
      })

      if (!hospital) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
      }

      await prisma.hospital.update({
        where: { id: hospital.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      })
    } else if (userType === 'admin') {
      const admin = await prisma.admin.findFirst({
        where: {
          email,
          passwordResetToken: hashedToken,
          passwordResetExpires: { gt: new Date() },
        },
      })

      if (!admin) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
      }

      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      })
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
