import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.EMAIL_FROM || 'VetBlood Bank <onboarding@resend.dev>'

function emailWrapper(title: string, bodyHtml: string): string {
  return `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#f9fafb;">
      <div style="background:#1e40af;color:white;padding:20px;text-align:center;">
        <h1 style="margin:0;font-size:24px;">VetBlood Bank</h1>
        <p style="margin:4px 0 0;font-size:14px;opacity:0.9;">Veterinary Blood Marketplace</p>
      </div>
      <div style="padding:24px;background:#ffffff;">
        <h2 style="color:#1f2937;margin-top:0;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:16px;text-align:center;color:#6b7280;font-size:12px;">
        <p style="margin:0;">VetBlood Bank - Trusted by Veterinary Hospitals</p>
      </div>
    </div>
  `
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[Email Skipped] To: ${to}, Subject: ${subject}`)
    return
  }
  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html })
  } catch (error) {
    console.error(`[Email Error] To: ${to}, Subject: ${subject}`, error)
  }
}

// --- Transactional Emails ---

export async function sendNewOfferEmail(params: {
  sellerEmail: string
  sellerName: string
  buyerName: string
  animalType: string
  bloodType: string
  quantity: number
  offeredPrice: number
  message?: string | null
}) {
  const html = emailWrapper('New Offer Received', `
    <p style="color:#374151;">Hi ${params.sellerName},</p>
    <p style="color:#374151;"><strong>${params.buyerName}</strong> has made an offer on your blood listing.</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#374151;"><strong>Animal Type:</strong> ${params.animalType}</p>
      <p style="margin:4px 0;color:#374151;"><strong>Blood Type:</strong> ${params.bloodType}</p>
      <p style="margin:4px 0;color:#374151;"><strong>Quantity:</strong> ${params.quantity} units</p>
      <p style="margin:4px 0;color:#374151;"><strong>Offered Price:</strong> $${params.offeredPrice.toFixed(2)}/unit</p>
      ${params.message ? `<p style="margin:4px 0;color:#374151;"><strong>Message:</strong> ${params.message}</p>` : ''}
    </div>
    <p style="color:#374151;">Log in to your dashboard to accept or reject this offer. The offer expires in 24 hours.</p>
  `)
  await sendEmail(params.sellerEmail, `New offer on your ${params.bloodType} listing`, html)
}

export async function sendOfferAcceptedEmail(params: {
  buyerEmail: string
  buyerName: string
  sellerName: string
  animalType: string
  bloodType: string
  quantity: number
  offeredPrice: number
  orderId: string
}) {
  const total = params.offeredPrice * params.quantity * 1.10
  const html = emailWrapper('Offer Accepted!', `
    <p style="color:#374151;">Hi ${params.buyerName},</p>
    <p style="color:#374151;">Great news! <strong>${params.sellerName}</strong> has accepted your offer.</p>
    <div style="background:#d1fae5;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#065f46;"><strong>Animal Type:</strong> ${params.animalType}</p>
      <p style="margin:4px 0;color:#065f46;"><strong>Blood Type:</strong> ${params.bloodType}</p>
      <p style="margin:4px 0;color:#065f46;"><strong>Quantity:</strong> ${params.quantity} units</p>
      <p style="margin:4px 0;color:#065f46;"><strong>Price:</strong> $${params.offeredPrice.toFixed(2)}/unit</p>
      <p style="margin:4px 0;color:#065f46;"><strong>Total (incl. fee):</strong> $${total.toFixed(2)}</p>
      <p style="margin:4px 0;color:#065f46;"><strong>Order ID:</strong> ${params.orderId}</p>
    </div>
    <p style="color:#374151;">Please complete your payment to finalize the order.</p>
  `)
  await sendEmail(params.buyerEmail, `Your offer for ${params.bloodType} was accepted!`, html)
}

export async function sendOfferRejectedEmail(params: {
  buyerEmail: string
  buyerName: string
  sellerName: string
  animalType: string
  bloodType: string
  quantity: number
}) {
  const html = emailWrapper('Offer Update', `
    <p style="color:#374151;">Hi ${params.buyerName},</p>
    <p style="color:#374151;">Unfortunately, <strong>${params.sellerName}</strong> has declined your offer for ${params.quantity} units of ${params.bloodType} (${params.animalType}).</p>
    <p style="color:#374151;">You can browse other available listings on the marketplace.</p>
  `)
  await sendEmail(params.buyerEmail, `Offer update for ${params.bloodType} listing`, html)
}

export async function sendPaymentConfirmedEmail(params: {
  email: string
  name: string
  role: 'buyer' | 'seller'
  orderId: string
  total: number
  items: Array<{ animalType: string; bloodType: string; quantity: number; pricePerUnit: number }>
}) {
  const isBuyer = params.role === 'buyer'
  const itemsHtml = params.items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#374151;">${item.animalType} - ${item.bloodType}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#374151;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#374151;">$${item.pricePerUnit.toFixed(2)}</td>
    </tr>
  `).join('')

  const html = emailWrapper(isBuyer ? 'Payment Confirmed' : 'Sale Confirmed', `
    <p style="color:#374151;">Hi ${params.name},</p>
    <p style="color:#374151;">${isBuyer ? 'Your payment has been confirmed.' : 'A payment has been received for your listing.'}</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#374151;"><strong>Order ID:</strong> ${params.orderId}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr style="background:#e5e7eb;">
            <th style="padding:8px;text-align:left;color:#374151;">Product</th>
            <th style="padding:8px;text-align:left;color:#374151;">Qty</th>
            <th style="padding:8px;text-align:left;color:#374151;">Price/Unit</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="margin:12px 0 4px;color:#374151;font-size:18px;"><strong>Total: $${params.total.toFixed(2)}</strong></p>
    </div>
    <p style="color:#374151;">${isBuyer ? 'The seller will prepare your order for pickup.' : 'Please prepare the order for buyer pickup.'}</p>
  `)
  await sendEmail(params.email, `Order ${params.orderId} - ${isBuyer ? 'Payment' : 'Sale'} Confirmed`, html)
}

export async function sendListingCreatedEmail(params: {
  hospitalEmail: string
  hospitalName: string
  animalType: string
  bloodType: string
  quantity: number
  pricePerUnit: number
  expirationDate: string
}) {
  const html = emailWrapper('Listing Created', `
    <p style="color:#374151;">Hi ${params.hospitalName},</p>
    <p style="color:#374151;">Your blood listing has been published to the marketplace.</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:4px 0;color:#374151;"><strong>Animal Type:</strong> ${params.animalType}</p>
      <p style="margin:4px 0;color:#374151;"><strong>Blood Type:</strong> ${params.bloodType}</p>
      <p style="margin:4px 0;color:#374151;"><strong>Quantity:</strong> ${params.quantity} units</p>
      <p style="margin:4px 0;color:#374151;"><strong>Price:</strong> $${params.pricePerUnit.toFixed(2)}/unit</p>
      <p style="margin:4px 0;color:#374151;"><strong>Expires:</strong> ${new Date(params.expirationDate).toLocaleDateString()}</p>
    </div>
    <p style="color:#374151;">Other hospitals in your area will be able to see and purchase this listing.</p>
  `)
  await sendEmail(params.hospitalEmail, `Listing created: ${params.bloodType} (${params.animalType})`, html)
}

export async function sendDailyDigestEmail(params: {
  hospitalEmail: string
  hospitalName: string
  listings: Array<{
    hospitalName: string
    animalType: string
    bloodType: string
    quantity: number
    pricePerUnit: number
    distanceMiles: number
  }>
}) {
  const listingsHtml = params.listings.map(l => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#374151;">${l.animalType}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#374151;">${l.bloodType}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#374151;">${l.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#374151;">$${l.pricePerUnit.toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#374151;">${l.distanceMiles} mi</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#374151;">${l.hospitalName}</td>
    </tr>
  `).join('')

  const html = emailWrapper('Daily Blood Availability', `
    <p style="color:#374151;">Hi ${params.hospitalName},</p>
    <p style="color:#374151;">Here are the blood products available within 50 miles of your hospital today:</p>
    <div style="overflow-x:auto;margin:16px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#1e40af;color:white;">
            <th style="padding:8px;text-align:left;">Animal</th>
            <th style="padding:8px;text-align:left;">Type</th>
            <th style="padding:8px;text-align:left;">Qty</th>
            <th style="padding:8px;text-align:left;">Price</th>
            <th style="padding:8px;text-align:left;">Distance</th>
            <th style="padding:8px;text-align:left;">Hospital</th>
          </tr>
        </thead>
        <tbody>${listingsHtml}</tbody>
      </table>
    </div>
    <p style="color:#374151;"><strong>${params.listings.length} listing${params.listings.length !== 1 ? 's' : ''}</strong> available near you.</p>
    <p style="color:#374151;">Log in to the marketplace to purchase or make offers.</p>
  `)
  await sendEmail(params.hospitalEmail, `${params.listings.length} blood products available near you`, html)
}
