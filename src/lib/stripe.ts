import Stripe from 'stripe'

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export function getStripe(): Stripe | null {
  if (isDemoMode || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === '') {
    return null
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover' as Stripe.LatestApiVersion
  })
}
