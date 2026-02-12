import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendContactFormEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message must be 2000 characters or less' }, { status: 400 })
    }

    // If logged in, include hospital name
    const session = await getServerSession(authOptions)
    const hospitalName = session?.user?.name || undefined

    await sendContactFormEmail({
      senderName: name,
      senderEmail: email,
      subject,
      message,
      hospitalName,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
