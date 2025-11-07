'use client'

import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="rounded-full bg-yellow-100 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pago cancelado</h2>
          <p className="text-gray-600 mb-6">
            Has cancelado el proceso de pago. Tu orden sigue pendiente y puedes intentar nuevamente cuando lo desees.
          </p>
          <div className="space-y-3">
            <Link
              href="/carrito"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              Volver al carrito
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
            >
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
