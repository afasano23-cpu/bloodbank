import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Hospital name is required'),
  address: z.string().min(5, 'Address is required'),
  licenseNumber: z.string().min(3, 'License number is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validatedData = registerSchema.parse(body)

    // Check if hospital already exists
    const existingHospital = await prisma.hospital.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { licenseNumber: validatedData.licenseNumber }
        ]
      }
    })

    if (existingHospital) {
      return NextResponse.json(
        { error: 'Hospital with this email or license number already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create hospital
    const hospital = await prisma.hospital.create({
      data: {
        ...validatedData,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        licenseNumber: true,
        phoneNumber: true
      }
    })

    return NextResponse.json(
      { message: 'Hospital registered successfully', hospital },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
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
