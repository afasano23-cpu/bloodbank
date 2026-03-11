import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { StatCard } from './StatCard'
import type { Transaction, TransactionSummary } from '../types'

export function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (paymentStatus) params.set('paymentStatus', paymentStatus)
      params.set('page', page.toString())
      const res = await fetch(`/api/admin/transactions?${params}`)
      const data = await res.json()
      setTransactions(data.transactions)
      setSummary(data.summary)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [startDate, endDate, paymentStatus, page])

  const handleExportCsv = async () => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (paymentStatus) params.set('paymentStatus', paymentStatus)
    params.set('export', 'csv')
    const res = await fetch(`/api/admin/transactions?${params}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Summary Cards */}
      {summary && (
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <StatCard icon="💵" value={`$${summary.totalVolume.toFixed(2)}`} label="Total Volume" color="text-green-600" />
          <StatCard icon="🏦" value={`$${summary.totalPlatformFees.toFixed(2)}`} label="Platform Fees" color="text-blue-600" />
          <StatCard icon="📊" value={summary.totalTransactions} label="Transactions" />
          <StatCard icon="📈" value={`$${summary.avgTransactionValue.toFixed(2)}`} label="Avg Transaction" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900"
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Transactions</h3>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-500">No transactions found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-3 font-semibold text-gray-700"></th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Buyer</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Seller</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">Subtotal</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">Buyer Fee</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">Seller Fee</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">Platform Rev</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">Seller Gets</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Payment</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Stripe</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <>
                      <tr
                        key={t.id}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === t.id ? null : t.id)}
                      >
                        <td className="py-3 px-3 text-gray-400">
                          {t.items.length > 0 && (expandedRow === t.id ? '▼' : '▶')}
                        </td>
                        <td className="py-3 px-3 text-gray-600 text-xs">
                          {format(new Date(t.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-3 text-gray-900">{t.buyer.name}</td>
                        <td className="py-3 px-3 text-gray-900">{t.seller.name}</td>
                        <td className="py-3 px-3 text-right text-gray-900">${t.subtotal.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-orange-600">${t.buyerFee.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-orange-600">${t.sellerFee.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-green-600 font-semibold">${t.serviceFee.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-blue-600">${t.sellerReceives.toFixed(2)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            t.paymentStatus === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : t.paymentStatus === 'Failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {t.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {t.paymentIntentId && !t.paymentIntentId.startsWith('demo_') ? (
                            <a
                              href={`https://dashboard.stripe.com/payments/${t.paymentIntentId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              {t.paymentIntentId?.startsWith('demo_') ? 'Demo' : '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                      {expandedRow === t.id && t.items.length > 0 && (
                        <tr key={`${t.id}-items`} className="bg-gray-50">
                          <td colSpan={11} className="py-3 px-8">
                            <div className="text-xs text-gray-600 mb-2 font-medium">Order Items:</div>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-1 px-2 text-gray-500">Animal</th>
                                  <th className="text-left py-1 px-2 text-gray-500">Blood Type</th>
                                  <th className="text-left py-1 px-2 text-gray-500">Qty</th>
                                  <th className="text-left py-1 px-2 text-gray-500">Price/Unit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {t.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="py-1 px-2">{item.listing.animalType}</td>
                                    <td className="py-1 px-2">{item.listing.bloodType}</td>
                                    <td className="py-1 px-2">{item.quantity}</td>
                                    <td className="py-1 px-2">${item.pricePerUnit.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 text-gray-700"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 text-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
