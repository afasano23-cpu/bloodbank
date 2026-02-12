import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'hospital') {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  const { searchParams } = new URL(req.url)
  const refresh = searchParams.get('refresh')

  const origin = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  if (refresh === 'true') {
    return NextResponse.redirect(new URL('/dashboard/settings?stripe=refresh', origin))
  }

  return NextResponse.redirect(new URL('/dashboard/settings?stripe=connected', origin))
}
