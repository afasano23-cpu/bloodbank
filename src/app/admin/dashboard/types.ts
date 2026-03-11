export type Tab = 'overview' | 'transactions' | 'offers' | 'hospitals' | 'listings' | 'orders'

export interface Stats {
  totalOrders: number
  totalRevenue: number
  activeListings: number
  totalHospitals: number
  totalOffers: number
  pendingOffers: number
  revenueByMonth: Record<string, number>
  avgOrderValue: number
  offerConversionRate: number
  revenueGrowth: number
  topHospitals: TopHospital[]
  bloodDemand: BloodDemand[]
}

export interface TopHospital {
  id: string
  name: string
  orderCount: number
  totalVolume: number
}

export interface BloodDemand {
  bloodType: string
  animalType: string
  count: number
}

export interface Order {
  id: string
  subtotal: number
  serviceFee: number
  total: number
  status: string
  paymentStatus: string
  paymentIntentId: string | null
  createdAt: string
  buyer: { name: string }
  seller: { name: string }
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  quantity: number
  pricePerUnit: number
  listing: {
    animalType: string
    bloodType: string
  }
}

export interface Hospital {
  id: string
  name: string
  email: string
  address: string
  phoneNumber: string
  stripeAccountId: string | null
  createdAt: string
  _count: {
    bloodListings: number
    purchaseOrders: number
    saleOrders: number
  }
}

export interface Listing {
  id: string
  animalType: string
  bloodType: string
  quantity: number
  pricePerUnit: number
  expirationDate: string
  isActive: boolean
  hospital: { name: string }
}

export interface Transaction {
  id: string
  subtotal: number
  serviceFee: number
  total: number
  buyerFee: number
  sellerFee: number
  sellerReceives: number
  status: string
  paymentStatus: string
  paymentIntentId: string | null
  createdAt: string
  buyer: { name: string }
  seller: { name: string }
  items: OrderItem[]
}

export interface TransactionSummary {
  totalVolume: number
  totalPlatformFees: number
  totalTransactions: number
  avgTransactionValue: number
}

export interface AdminOffer {
  id: string
  offeredPrice: number
  quantity: number
  message: string | null
  status: string
  expiresAt: string
  createdAt: string
  buyer: { name: string }
  listing: {
    animalType: string
    bloodType: string
    pricePerUnit: number
    hospital: { name: string }
  }
}

export interface OfferStatusCounts {
  Pending: number
  Accepted: number
  Rejected: number
  Expired: number
  Cancelled: number
}
