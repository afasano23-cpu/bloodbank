interface OfferStatusBadgeProps {
  status: string
}

export default function OfferStatusBadge({ status }: OfferStatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'Expired':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'Cancelled':
        return 'bg-gray-100 text-gray-600 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles()}`}
    >
      {status}
    </span>
  )
}
