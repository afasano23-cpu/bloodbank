import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">VetBlood Bank</h1>
              <p className="text-xs text-gray-600">🏥 Trusted by Veterinary Hospitals</p>
            </div>
            <div className="space-x-4">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-blue-800 hover:text-blue-900 font-medium"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="flex justify-center gap-4 mb-6 flex-wrap">
            <span className="trust-badge">🔒 HIPAA Compliant</span>
            <span className="trust-badge">✓ Verified Hospitals</span>
            <span className="trust-badge">⚡ Fast Processing</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Life-Saving Blood Bank Network for Veterinary Care
          </h2>
          <p className="text-xl text-gray-900 max-w-3xl mx-auto mb-8">
            Connect veterinary hospitals for life-saving blood donations with secure self-pickup.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-4 bg-emerald-600 text-white text-lg rounded-lg hover:bg-emerald-700 font-semibold shadow-lg"
          >
            Get Started
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="medical-card">
            <div className="text-4xl mb-4">🏥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Verified Network
            </h3>
            <p className="text-gray-900">
              All hospitals verified with license numbers. Join a trusted network
              of veterinary professionals.
            </p>
          </div>

          <div className="medical-card">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Secure Platform
            </h3>
            <p className="text-gray-900">
              HIPAA compliant with end-to-end encryption. Secure transactions
              and data protection for all participants.
            </p>
          </div>

          <div className="medical-card">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Rapid Access
            </h3>
            <p className="text-gray-900">
              Instant inventory search with real-time availability. Get the blood
              products you need when you need them.
            </p>
          </div>
        </div>

        <div className="mt-20 bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-md p-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            How It Works
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-emerald-600">
                1
              </div>
              <h4 className="font-semibold mb-2">Register</h4>
              <p className="text-sm text-gray-900">
                Sign up with your hospital credentials
              </p>
            </div>
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-emerald-600">
                2
              </div>
              <h4 className="font-semibold mb-2">Browse</h4>
              <p className="text-sm text-gray-900">
                Search for blood by type and location
              </p>
            </div>
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-emerald-600">
                3
              </div>
              <h4 className="font-semibold mb-2">Purchase</h4>
              <p className="text-sm text-gray-900">
                Secure checkout with self-pickup coordination
              </p>
            </div>
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-emerald-600">
                4
              </div>
              <h4 className="font-semibold mb-2">Track</h4>
              <p className="text-sm text-gray-900">
                Monitor order status and pickup details
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-6 mb-4 text-sm flex-wrap">
            <span>🔒 Secure & Encrypted</span>
            <span>✓ Licensed Hospitals Only</span>
            <span>🛡️ Platform Verified</span>
          </div>
          <p>&copy; 2026 VetBlood Bank. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
