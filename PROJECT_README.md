# VetBlood Bank - Veterinary Blood Marketplace

A comprehensive web application for veterinary hospitals to buy and sell blood products with secure payment processing and courier delivery options.

## Features

### For Veterinary Hospitals
- **Authentication**: Secure registration and login system
- **Blood Listings**: Post and manage blood inventory with detailed information
- **Marketplace**: Browse and search available blood products
- **Purchasing**: Secure checkout with Stripe integration and 10% service fee
- **Delivery Options**: Self-pickup or courier delivery with tracking
- **Order Management**: Track purchases and sales
- **Dashboard**: Comprehensive overview of listings, orders, and activity

### For Couriers
- **Driver Interface**: Accept and manage delivery requests
- **Online/Offline Status**: Control availability for deliveries
- **Delivery Tracking**: Real-time status updates

### For Administrators
- **Platform Analytics**: View total transactions, revenue, and active listings
- **User Management**: Track registered hospitals and couriers
- **Order Monitoring**: View all platform orders and statuses

## Test Credentials

### Admin
- Email: `admin@vetblood.com`
- Password: `admin123`

### Demo Hospital
- Email: `demo@hospital.com`
- Password: `hospital123`

### Demo Courier
- Email: `demo@courier.com`
- Password: `courier123`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: NextAuth.js
- **Database**: Prisma ORM with SQLite
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Blood Types Supported

### Dogs
- DEA 1.1+
- DEA 1.1-
- DEA 3
- DEA 4
- DEA 5
- DEA 7

### Cats
- Type A
- Type B
- Type AB

## Getting Started

1. The application is already built and ready to run
2. Run seed script (already done): `npx tsx prisma/seed.ts`
3. Start the development server: `npm run dev`
4. Open http://localhost:3000

## Key Features Implemented

### 1. User Authentication
- Multi-role authentication (Hospital, Courier, Admin)
- Secure password hashing with bcrypt
- Session management with NextAuth.js

### 2. Blood Listing System
- Create, edit, and delete listings
- Specify animal type, blood type, quantity, price, expiration date, and storage conditions
- Automatic quantity updates after purchases

### 3. Marketplace
- Search and filter by animal type, blood type, and price range
- Sort by date posted, price, or expiration date
- Detailed listing view with seller information

### 4. Purchasing Flow
- Quantity selection
- Order summary with 10% service fee clearly displayed
- Stripe payment integration
- Order confirmation and tracking

### 5. Delivery System
- Self-pickup option (free)
- Courier delivery option ($25 flat rate)
- Delivery status tracking
- Courier dashboard for accepting deliveries

### 6. Dashboards
- Hospital: Manage listings, view purchases and sales
- Courier: Accept deliveries, track active jobs
- Admin: Platform analytics and order monitoring

## Notes

- Stripe integration requires valid API keys in the `.env` file
- The current implementation uses a simplified distance calculation for delivery fees
- Real-time tracking uses a basic status system (can be enhanced with actual GPS tracking)
- The application uses SQLite for development (can be switched to PostgreSQL for production)

## Future Enhancements

- Real-time notifications with WebSockets
- Advanced search with location-based filtering using geolocation
- Photo confirmation for deliveries
- Rating and review system
- Email notifications for orders and deliveries
- Mobile app for couriers
- Advanced analytics for administrators
- Multi-language support
