'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
        descripcion?: string
      }
    }>
  }
}

export default function FacturaDetalle() {
  const params = useParams()
  const router = useRouter()
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFactura()
  }, [])

  const fetchFactura = async () => {
    try {
      const response = await fetch(`/api/pagos/factura/${params.id}`, {
        credentials: 'include',
        cache: 'no-store',
      })

      if (response.ok) {
        const data = await response.json()
        setFactura(data)
      } else {
        setError('No se pudo cargar la factura')
      }
    } catch (err) {
      console.error('Error al cargar factura:', err)
      setError('Error al cargar la factura')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando factura...</p>
        </div>
      </div>
    )
  }

  if (error || !factura) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Factura no encontrada'}</p>
          <Link
            href="/facturas"
            className="text-blue-600 hover:underline"
          >
            Volver a mis facturas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <Link
          href="/facturas"
          className="text-blue-600 hover:underline text-sm flex items-center gap-2"
        >
          ← Volver a mis facturas
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Factura #{factura.id}</h1>
            <p className="text-gray-600">Orden #{factura.orden.id}</p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                factura.estado === 'completed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {factura.estado === 'completed' ? 'Pagado' : 'Pendiente'}
            </span>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(factura.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Información del cliente</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700"><strong>Nombre:</strong> {factura.orden.user_name}</p>
            <p className="text-gray-700"><strong>Email:</strong> {factura.orden.user_email}</p>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Productos</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Precio Unit.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {factura.orden.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.producto.nombre}</p>
                        {item.producto.descripcion && (
                          <p className="text-sm text-gray-500">{item.producto.descripcion}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700">
                      {item.cantidad}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      $ {Number(item.precio_unitario).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      $ {Number(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between text-gray-700 mb-2">
                <span>Subtotal:</span>
                <span>$ {Number(factura.monto).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span>$ {Number(factura.monto).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Información de pago */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Información de pago</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700"><strong>Método:</strong> {factura.metodo.toUpperCase()}</p>
            <p className="text-gray-700 text-sm"><strong>ID de transacción:</strong> {factura.stripe_id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
