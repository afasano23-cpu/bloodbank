'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

export default function BrochurePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [html, setHtml] = useState('')
  const [copied, setCopied] = useState(false)
  const [registerUrl, setRegisterUrl] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    else if (status === 'authenticated' && session.user.role !== 'admin') router.push('/dashboard')
  }, [status, router])

  useEffect(() => {
    setRegisterUrl(`${window.location.origin}/auth/register`)
  }, [])

  useEffect(() => {
    if (!registerUrl) return
    fetch('/api/admin/brochure')
      .then(res => res.json())
      .then(data => {
        const replaced = data.html.replace('{{REGISTER_URL}}', registerUrl)
        setHtml(replaced)
      })
      .catch(console.error)
  }, [registerUrl])

  useEffect(() => {
    if (!html || !iframeRef.current) return
    const doc = iframeRef.current.contentDocument
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
    }
  }, [html])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vetblood-bank-brochure.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/admin/dashboard" className="text-2xl font-bold text-blue-600">VetBlood Bank - Admin</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-800">&larr; Back to Dashboard</Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Email Brochure</h2>
            <p className="text-gray-600 text-sm mt-1">Preview, copy HTML, or download to use in your email campaigns.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              {copied ? 'Copied!' : 'Copy HTML'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
            >
              Download .html
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <iframe
            ref={iframeRef}
            title="Brochure Preview"
            className="w-full border-0"
            style={{ height: '900px' }}
          />
        </div>
      </div>
    </div>
  )
}
