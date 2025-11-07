'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Factura {
  id: number
  orden_id: number
  stripe_id: string
  monto: number
  estado: string
  metodo: string
  factura_url: string | null
  created_at: string
  orden: {
    id: number
    user_id: number
    user_email: string
    user_name: string
    total: number
    estado: string
    created_at: string
    updated_at: string
    items: Array<{
      id: number
      cantidad: number
      precio_unitario: number
      subtotal: number
      producto: {
        id: number
        nombre: string
        precio: number
      }
    }>
  }
}

export default function FacturasCliente() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    verificarUsuario()
  }, [])

  const verificarUsuario = async () => {
    try {
      const meResponse = await fetch('/api/me', { credentials: 'include' })
      if (meResponse.ok) {
        const user = await meResponse.json()
        setUserEmail(user.email)
        fetchFacturas(user.email)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error al verificar usuario:', error)
      setLoading(false)
    }
  }

  const fetchFacturas = async (email: string) => {
    try {
      const response = await fetch('/api/pagos/facturas', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        // El backend ya filtra por usuario si no es admin
        setFacturas(data)
      }
    } catch (error) {
      console.error('Error al cargar facturas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return <div className="p-8 text-center">Cargando facturas...</div>

  if (!userEmail)
    return (
      <div className="p-8 text-center text-gray-600">
        Debes iniciar sesión para ver tus facturas.
      </div>
    )

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis Facturas</h1>
        <p className="text-gray-600">Historial de tus facturas y pagos</p>
      </div>

      {facturas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            Aún no tienes facturas registradas.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Orden #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {facturas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        #{factura.orden.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(factura.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-gray-900">
                        Bs. {Number(factura.monto).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          factura.estado === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {factura.estado === 'completed' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/facturas/${factura.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                      >
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
