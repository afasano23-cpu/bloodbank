import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  vehicleType: z.string().optional(),
  licensePlate: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    const existingCourier = await prisma.courier.findUnique({
      where: { email: validatedData.email }
    })

    if (existingCourier) {
      return NextResponse.json(
        { error: 'Courier with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    const courier = await prisma.courier.create({
      data: {
        ...validatedData,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true
      }
    })

    return NextResponse.json(
      { message: 'Courier registered successfully', courier },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error' },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
