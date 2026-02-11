# VetBlood Bank - Veterinary Blood Marketplace

A peer-to-peer web application for veterinary hospitals to buy and sell blood products with transparent fee structure and secure payment processing.

## Features

### For Veterinary Hospitals
- **Authentication**: Secure registration and login system
- **Blood Listings**: Post and manage blood inventory with detailed information
- **Marketplace**: Browse and search available blood products
- **Purchasing**: Secure checkout with transparent fee display
- **Self-Pickup**: All orders for pickup at seller location
- **Order Management**: Track purchases and sales
- **Dashboard**: Comprehensive overview of listings, orders, and activity

### For Administrators
- **Platform Analytics**: View total transactions, revenue, and active listings
- **User Management**: Track registered hospitals
- **Order Monitoring**: View all platform orders and statuses

## Fee Structure (P2P Marketplace)

**Transparent Fee Model:**
- **Seller Receives**: 90% of listing price
- **Seller Fee**: 10% (deducted from listing price)
- **Buyer Pays**: Listing price + 10% service fee
- **Total Platform Revenue**: 20% of listing price

**Example for $100 listing:**
- Seller receives: $90
- Buyer pays: $110
- Platform keeps: $20

This equal split (10% + 10%) ensures fair cost distribution between buyers and sellers.

## Test Credentials

### Admin
- Email: `admin@vetblood.com`
- Password: `admin123`

### Demo Hospital
- Email: `demo@hospital.com`
- Password: `hospital123`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Authentication**: NextAuth.js
- **Database**: Prisma ORM with SQLite
- **Payments**: Stripe (with demo mode support)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Blood Types Supported

### Dogs
- DEA 1.1+, DEA 1.1-, DEA 3, DEA 4, DEA 5, DEA 7

### Cats
- Type A, Type B, Type AB

## Payment Options

### Demo Mode (Default)
- No real payment processing
- Simulates successful payments
- Perfect for testing and demos
- Set `NEXT_PUBLIC_DEMO_MODE="true"` in `.env`

### Stripe Integration
1. Get API keys from [Stripe Dashboard](https://dashboard.stripe.com)
2. Add to `.env`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   STRIPE_SECRET_KEY=sk_test_your_key
   NEXT_PUBLIC_DEMO_MODE="false"
   ```
3. Restart dev server

**Test Cards (Stripe Test Mode):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Expiry: Any future date, CVC: Any 3 digits

## Getting Started

1. Application is already built and ready
2. Start dev server: `npm run dev`
3. Open http://localhost:3000
4. Use test credentials or register a new hospital

## Key Features Implemented

### 1. User Authentication
- Hospital and Admin login types
- Secure password hashing with bcrypt
- Session management with NextAuth.js

### 2. Blood Listing System
- Create, edit, and delete listings
- Animal type, blood type, quantity, price, expiration, storage conditions
- Automatic quantity updates after purchases

### 3. Marketplace
- Search and filter by animal type, blood type, price range
- Sort by date, price, or expiration
- Detailed listing views with seller information

### 4. Transparent Pricing
- Clear fee breakdown at checkout
- Shows seller payout amount (90%)
- Buyer sees 10% service fee
- Total 20% platform revenue split equally (10% + 10%)

### 5. Order Management
- Self-pickup only (simplified logistics)
- Order status tracking
- Purchase and sales history
- Seller contact information provided

### 6. Admin Dashboard
- Platform analytics and metrics
- Total revenue from service fees
- Active listings and hospital count
- Recent order monitoring

## P2P Payment Notes

**Current Implementation:**
- Payments collected via Stripe to platform account
- Fee structure clearly displayed to both parties
- Order tracking and history maintained

**For Production P2P (Future Enhancement):**
- Implement Stripe Connect for automatic fund distribution
- Sellers connect their Stripe accounts
- Automatic 90/10 split on each transaction
- Platform fee kept automatically

## Future Enhancements

- Stripe Connect for automatic seller payouts
- Email notifications for orders
- Advanced search with location-based filtering
- Rating and review system
- Bulk listing import
- Mobile-responsive optimizations
- Export order history

## Notes

- SQLite database for development (switch to PostgreSQL for production)
- All orders are self-pickup at seller location
- Expiration date tracking for blood products
- Platform fee calculated and displayed transparently

## Support

For questions or issues, contact the platform administrator.

---

**Built with Next.js 16 + Stripe + Prisma** | **License: MIT**
