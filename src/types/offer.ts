export interface Offer {
  id: string
  listingId: string
  buyerId: string
  offeredPrice: number
  quantity: number
  message: string | null
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired' | 'Cancelled'
  expiresAt: string
  acceptedAt: string | null
  rejectedAt: string | null
  createdAt: string
  updatedAt: string
  listing?: {
    id: string
    animalType: string
    bloodType: string
    pricePerUnit: number
    quantity: number
    expirationDate: string
    storageConditions: string
    notes: string | null
    isActive: boolean
    hospital: {
      id: string
      name: string
      address: string
      email: string
      phoneNumber: string
    }
  }
  buyer?: {
    id: string
    name: string
    email: string
    phoneNumber: string
    address: string
  }
}

export interface CreateOfferInput {
  listingId: string
  offeredPrice: number
  quantity: number
  message?: string
}

export interface OfferResponse {
  offer?: Offer
  error?: string
  message?: string
}

export interface AcceptOfferResponse {
  orderId: string
  clientSecret: string
  offerId: string
}
