// src/components/NavBar.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import UserMenu, { Me } from './UserMenu'
import { usePathname } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'

export default function NavBar() {
  const pathname = usePathname()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [carritoCount, setCarritoCount] = useState(0)
  const can = (p: string) => Boolean(me?.permissions?.includes(p))

  const fetchMe = useCallback(async () => {
    try {
      const r = await fetch('/api/me', { credentials: 'include', cache: 'no-store' })
      const user = r.ok ? ((await r.json()) as Me) : null
      setMe(user)

      if (user) {
        fetchCarritoCount()
      } else {
        setCarritoCount(0)
      }
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCarritoCount = useCallback(async () => {
    try {
      const response = await fetch('/api/carrito', { credentials: 'include', cache: 'no-store' })
      if (response.ok) {
        const items = await response.json()
        setCarritoCount(items.length)
      }
    } catch {
      // noop
    }
  }, [])

  useEffect(() => {
    fetchMe()

    const onAuthChanged = () => { void fetchMe() }
    const onCarritoChanged = () => { void fetchCarritoCount() }

    window.addEventListener('auth:changed', onAuthChanged)
    window.addEventListener('carrito:changed', onCarritoChanged)

    return () => {
      window.removeEventListener('auth:changed', onAuthChanged)
      window.removeEventListener('carrito:changed', onCarritoChanged)
    }
  }, [fetchMe, fetchCarritoCount])

  const isAdminPath = pathname?.startsWith('/admin')
  if (isAdminPath) return null

  const links = [
    { href: '/productos', label: 'Productos' },
    { href: '/facturas', label: 'Mis Facturas' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[#9BA8AB] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      {/* contenedor más fluido en móviles, mismo ancho en desktop */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="h-14 flex items-center gap-3 sm:gap-6">
          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 -ml-2 rounded hover:bg-[#CCD0CF]"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="font-bold text-lg text-[#11212D]">
            Smart Sales
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium">
            {links.map(link => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-1 py-2 transition-colors
                    ${isActive
                      ? 'text-[#11212D] font-semibold'
                      : 'text-[#4A5C6A] hover:text-[#253745]'}
                  `}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#11212D] rounded" />
                  )}
                </Link>
              )
            })}
            {me && can('user.read') && (
              <Link
                href="/admin"
                className={`ml-1 relative px-1 py-2 ${
                  pathname.startsWith('/admin')
                    ? 'text-[#11212D] font-semibold'
                    : 'text-[#4A5C6A] hover:text-[#253745]'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Botón carrito */}
            {me && (
              <Link
                href="/carrito"
                className="relative p-2 hover:bg-[#CCD0CF] rounded-full transition"
                title="Ver carrito"
                aria-label={`Ver carrito${carritoCount ? `, ${carritoCount} productos` : ''}`}
              >
                <ShoppingCart size={22} className="text-[#4A5C6A]" />
                {carritoCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#11212D] text-white text-[10px] font-bold rounded-full min-h-[20px] min-w-[20px] px-1 flex items-center justify-center">
                    {carritoCount}
                  </span>
                )}
              </Link>
            )}

            {loading ? (
              <span className="text-xs text-[#4A5C6A]">Cargando…</span>
            ) : me ? (
              <UserMenu me={me} />
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 text-sm">
                <Link href="/login" className="hover:text-[#253745] px-2 py-1 rounded hover:bg-[#CCD0CF]">
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  className="bg-[#11212D] text-white px-3 py-1.5 rounded-md hover:bg-[#06141B] transition"
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-3 border-t border-[#9BA8AB] text-sm bg-white/95">
            <nav className="flex flex-col gap-1 pt-3">
              {me && (
                <Link
                  href="/carrito"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-2 rounded hover:bg-[#CCD0CF] flex items-center gap-2"
                >
                  <ShoppingCart size={18} />
                  <span>Mi Carrito</span>
                  {carritoCount > 0 && (
                    <span className="ml-auto bg-[#11212D] text-white text-[10px] font-bold rounded-full min-h-[20px] min-w-[20px] px-1 flex items-center justify-center">
                      {carritoCount}
                    </span>
                  )}
                </Link>
              )}
              {links.map(link => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-2 py-2 rounded ${
                      isActive
                        ? 'bg-[#CCD0CF] text-[#11212D] font-semibold'
                        : 'hover:bg-[#CCD0CF]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              {me && can('user.read') && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={`px-2 py-2 rounded ${
                    pathname.startsWith('/admin')
                      ? 'bg-[#CCD0CF] text-[#11212D] font-semibold'
                      : 'hover:bg-[#CCD0CF]'
                  }`}
                >
                  Admin
                </Link>
              )}
              {!me && (
                <div className="grid grid-cols-2 gap-2 px-1">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center px-3 py-2 rounded border border-[#9BA8AB] hover:bg-[#CCD0CF]">
                    Ingresar
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="text-center px-3 py-2 rounded bg-[#11212D] text-white hover:bg-[#06141B]">
                    Crear cuenta
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
