import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">VetBlood Bank</h1>
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Veterinary Blood Bank Marketplace
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect veterinary hospitals for life-saving blood donations.
            Buy and sell blood products with secure delivery options.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 font-semibold shadow-lg"
          >
            Get Started
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🏥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              For Hospitals
            </h3>
            <p className="text-gray-600">
              List your available blood inventory and purchase what you need
              from verified veterinary hospitals.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Fast Delivery
            </h3>
            <p className="text-gray-600">
              Choose between self-pickup or courier delivery with real-time
              tracking for urgent needs.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Secure & Verified
            </h3>
            <p className="text-gray-600">
              All hospitals are verified with license numbers. Secure payments
              through Stripe.
            </p>
          </div>
        </div>

        <div className="mt-20 bg-white rounded-lg shadow-md p-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            How It Works
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                1
              </div>
              <h4 className="font-semibold mb-2">Register</h4>
              <p className="text-sm text-gray-600">
                Sign up with your hospital credentials
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                2
              </div>
              <h4 className="font-semibold mb-2">Browse</h4>
              <p className="text-sm text-gray-600">
                Search for blood by type and location
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                3
              </div>
              <h4 className="font-semibold mb-2">Purchase</h4>
              <p className="text-sm text-gray-600">
                Secure checkout with delivery options
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                4
              </div>
              <h4 className="font-semibold mb-2">Track</h4>
              <p className="text-sm text-gray-600">
                Real-time order and delivery tracking
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 VetBlood Bank. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
