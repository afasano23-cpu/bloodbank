# VetBlood Bank - Vercel Deployment Guide

## Prerequisites

1. A Vercel account (https://vercel.com)
2. A PostgreSQL database (recommended: Vercel Postgres or Supabase)
3. Stripe account with production keys

## Step 1: Database Setup

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Copy the `DATABASE_URL` connection string

### Option B: Supabase

1. Create a project at https://supabase.com
2. Go to Settings → Database
3. Copy the connection string (use "Session mode" for serverless)

## Step 2: Environment Variables

Configure these in your Vercel project settings:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-here

# Stripe (Production Keys)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Demo Mode (set to false for production)
NEXT_PUBLIC_DEMO_MODE=false
```

### Generate NEXTAUTH_SECRET

Run this command locally:
```bash
openssl rand -base64 32
```

## Step 3: Deploy to Vercel

### Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Method 2: GitHub Integration

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Configure environment variables
5. Deploy

## Step 4: Database Migration

After deployment, run migrations:

```bash
# Option 1: Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Option 2: In Vercel dashboard
# Go to your project → Settings → Environment Variables
# Add all required variables
# Then run migrations from your local machine
```

## Step 5: Seed Database (Optional)

If you need to seed the database with initial data:

```bash
npx prisma db seed
```

## Step 6: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret
5. Add it to Vercel as `STRIPE_WEBHOOK_SECRET`

## Step 7: Test Deployment

1. Visit your deployed app: `https://your-app.vercel.app`
2. Register a new hospital account
3. Create a blood listing
4. Test the marketplace
5. Complete a test purchase

## Important Notes

### Database Considerations

- **SQLite is NOT compatible** with Vercel serverless functions
- The schema has been updated to use PostgreSQL
- Make sure your `DATABASE_URL` includes `?sslmode=require` for production

### Migration from SQLite

If you had local SQLite data you want to preserve:

1. Export data from SQLite database
2. Set up PostgreSQL database
3. Run `npx prisma migrate deploy`
4. Import data into PostgreSQL

### Remember Me Feature

The new remember me functionality will work automatically:
- Checked: Session lasts 30 days
- Unchecked: Session lasts 24 hours

### Medical Design Theme

The application now uses a medical/professional color scheme:
- Primary: Blue-800 (#1E40AF) and Emerald-600 (#10B981)
- Trust badges and security indicators throughout
- All delivery references removed (self-pickup only)

## Troubleshooting

### Build Fails

```bash
# Check build locally first
npm run build

# Check for TypeScript errors
npm run lint
```

### Database Connection Issues

- Ensure `DATABASE_URL` is properly formatted
- Check that the database allows connections from Vercel IPs
- Verify SSL mode is enabled for production databases

### Stripe Issues

- Ensure you're using production keys (sk_live_, pk_live_)
- Verify webhook endpoint is configured correctly
- Check webhook signing secret matches

## Post-Deployment Checklist

- [ ] Database connected and migrated
- [ ] Environment variables configured
- [ ] Can register new hospital
- [ ] Can login successfully
- [ ] Remember me checkbox works
- [ ] Can create blood listing
- [ ] Marketplace loads correctly
- [ ] Checkout flow works
- [ ] Stripe payments process
- [ ] Webhook receives events
- [ ] Medical theme displays correctly
- [ ] Trust badges visible
- [ ] No delivery references remain

## Support

For issues or questions:
- Check Vercel logs: Project → Deployments → View Function Logs
- Check Stripe logs: Dashboard → Developers → Events
- Review database logs in your database provider dashboard
