'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export default function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(true)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Verificar estado inicial
    setIsOnline(navigator.onLine)

    // Handlers para eventos de conexión
    const handleOnline = () => {
      console.log('✅ Conexión restaurada')
      setIsOnline(true)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }

    const handleOffline = () => {
      console.log('⚠️ Sin conexión a internet')
      setIsOnline(false)
      setShowNotification(true)
    }

    // Agregar event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // No mostrar nada si está online y no hay notificación
  if (isOnline && !showNotification) {
    return null
  }

  return (
    <>
      {/* Notificación flotante */}
      {showNotification && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg shadow-lg p-4 flex items-center gap-3 animate-slide-in ${
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-orange-500 text-white'
          }`}
          role="alert"
        >
          {isOnline ? (
            <>
              <Wifi className="w-5 h-5" />
              <div>
                <p className="font-semibold">Conexión restaurada</p>
                <p className="text-sm opacity-90">Ahora estás en línea</p>
              </div>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5" />
              <div>
                <p className="font-semibold">Sin conexión</p>
                <p className="text-sm opacity-90">Modo offline activado</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Barra persistente cuando está offline */}
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-orange-500 text-white py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">
            Sin conexión a internet - Trabajando en modo offline
          </span>
        </div>
      )}
    </>
  )
}
