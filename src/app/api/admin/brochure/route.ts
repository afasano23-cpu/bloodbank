import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateBrochureHtml } from '@/lib/brochure'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const html = generateBrochureHtml()
    return NextResponse.json({ html })
  } catch (error) {
    console.error('Error generating brochure:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
