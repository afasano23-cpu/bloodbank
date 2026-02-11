import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@vetblood.com' },
    update: {},
    create: {
      email: 'admin@vetblood.com',
      password: adminPassword,
      name: 'Admin User'
    }
  })
  console.log('✓ Created admin user:', admin.email)

  // Create sample hospital
  const hospitalPassword = await bcrypt.hash('hospital123', 10)
  const hospital = await prisma.hospital.upsert({
    where: { email: 'demo@hospital.com' },
    update: {},
    create: {
      name: 'Demo Veterinary Hospital',
      address: '123 Main St, New York, NY 10001',
      licenseNumber: 'VET-12345',
      email: 'demo@hospital.com',
      phoneNumber: '555-0100',
      password: hospitalPassword,
      latitude: 40.7128,
      longitude: -74.0060
    }
  })
  console.log('✓ Created demo hospital:', hospital.email)

  // Create sample courier
  const courierPassword = await bcrypt.hash('courier123', 10)
  const courier = await prisma.courier.upsert({
    where: { email: 'demo@courier.com' },
    update: {},
    create: {
      name: 'Demo Courier',
      email: 'demo@courier.com',
      phoneNumber: '555-0200',
      password: courierPassword,
      vehicleType: 'Van',
      licensePlate: 'ABC-1234'
    }
  })
  console.log('✓ Created demo courier:', courier.email)

  // Create sample blood listings
  const listing1 = await prisma.bloodListing.create({
    data: {
      hospitalId: hospital.id,
      animalType: 'Dog',
      bloodType: 'DEA 1.1+',
      quantity: 5,
      pricePerUnit: 150.00,
      expirationDate: new Date('2026-06-01'),
      storageConditions: 'Refrigerated at 2-6°C',
      notes: 'Freshly collected, tested for common pathogens'
    }
  })
  console.log('✓ Created sample listing 1')

  const listing2 = await prisma.bloodListing.create({
    data: {
      hospitalId: hospital.id,
      animalType: 'Cat',
      bloodType: 'Type A',
      quantity: 3,
      pricePerUnit: 180.00,
      expirationDate: new Date('2026-05-15'),
      storageConditions: 'Refrigerated at 2-6°C',
      notes: 'High quality feline blood'
    }
  })
  console.log('✓ Created sample listing 2')

  console.log('\n✅ Seeding completed!')
  console.log('\nTest credentials:')
  console.log('──────────────────────────────────')
  console.log('Admin:')
  console.log('  Email: admin@vetblood.com')
  console.log('  Password: admin123')
  console.log('\nHospital:')
  console.log('  Email: demo@hospital.com')
  console.log('  Password: hospital123')
  console.log('\nCourier:')
  console.log('  Email: demo@courier.com')
  console.log('  Password: courier123')
  console.log('──────────────────────────────────\n')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
