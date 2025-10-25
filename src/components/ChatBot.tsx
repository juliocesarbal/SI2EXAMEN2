'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Swal from 'sweetalert2'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  productos?: Producto[]
}

interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  marca: string
  categoria: string
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '¡Hola! Soy tu asistente virtual de Smart Sales. ¿En qué puedo ayudarte hoy? Cuéntame qué productos buscas y te ayudaré a encontrarlos.',
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [addingToCart, setAddingToCart] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Cierra el chat si cambias de ruta
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // No mostrar el chat en rutas de administración
  if (pathname?.startsWith('/admin')) return null

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      })

      if (!response.ok) throw new Error('Error al enviar mensaje')

      const data = await response.json()

      const cleanedResponse = String(data.response || '')
        .replace(/\[PRODUCTO:\d+:[^\]]+\]/g, '')
        .trim()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanedResponse || '🙂',
        productos: data.productos,
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const addToCarrito = async (productoId: number) => {
    setAddingToCart(productoId)

    try {
      const authResponse = await fetch('/api/me', { credentials: 'include' })

      if (!authResponse.ok) {
        Swal.fire({
          title: 'Debes iniciar sesión',
          text: 'Para agregar productos al carrito, inicia sesión primero',
          icon: 'info',
          confirmButtonText: 'Ir a login',
        }).then(() => {
          router.push('/login')
        })
        setAddingToCart(null)
        return
      }

      const response = await fetch('/api/carrito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productoId, cantidad: 1 }),
      })

      if (response.ok) {
        Swal.fire({
          title: '¡Agregado!',
          text: 'Producto agregado al carrito',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        })
        window.dispatchEvent(new Event('carrito:changed'))
      } else {
        throw new Error('Error al agregar')
      }
    } catch (error) {
      console.error('Error:', error)
      Swal.fire('Error', 'No se pudo agregar al carrito', 'error')
    } finally {
      setAddingToCart(null)
    }
  }

  return (
    <>
      {/* Botón flotante (mejor hit-area y responsive) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-[#11212D] hover:bg-[#06141B] text-white rounded-full p-4 sm:p-5 shadow-lg transition-transform active:scale-95"
          aria-label="Abrir chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </button>
      )}

      {/* Ventana de chat (responsive y amigable) */}
      {isOpen && (
        <div
          className="fixed z-50 right-3 left-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-6 w-auto sm:w-96 max-w-md mx-auto h-[70vh] sm:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-[#9BA8AB] overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Chat de asistencia"
        >
          {/* Header */}
          <div className="bg-[#11212D] text-white p-3 sm:p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">💬</div>
              <div className="truncate">
                <h3 className="font-semibold leading-tight truncate">Asistente Smart Sales</h3>
                <p className="text-[11px] sm:text-xs text-[#CCD0CF]">En línea</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/90 hover:bg-white/20 rounded-full p-1.5 transition"
              aria-label="Cerrar chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-[#CCD0CF]/20">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[92%] sm:max-w-[80%] text-[13px] sm:text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-[#253745] text-white'
                      : 'bg-white border border-[#9BA8AB]'
                  } rounded-2xl p-2.5 sm:p-3 shadow-sm`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>

                  {/* Productos recomendados */}
                  {message.productos && message.productos.length > 0 && (
                    <div className="mt-2 sm:mt-3 space-y-2">
                      <p className="text-[11px] sm:text-xs font-semibold text-[#253745] border-t border-[#9BA8AB] pt-2">
                        Productos recomendados:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {message.productos.map(producto => (
                          <div key={producto.id} className="bg-[#CCD0CF]/30 border border-[#9BA8AB] rounded-lg p-2">
                            <p className="text-[12px] sm:text-xs font-semibold text-[#11212D] truncate">
                              {producto.nombre}
                            </p>
                            <p className="text-[11px] sm:text-xs text-[#4A5C6A] truncate">
                              {producto.marca} • {producto.categoria}
                            </p>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <span className="text-sm font-bold text-[#253745] shrink-0">
                                Bs. {producto.precio.toFixed(2)}
                              </span>
                              <button
                                onClick={() => addToCarrito(producto.id)}
                                disabled={addingToCart === producto.id}
                                className="bg-[#11212D] hover:bg-[#06141B] text-white text-[11px] sm:text-xs px-3 py-1 rounded-md transition disabled:bg-[#4A5C6A] disabled:cursor-not-allowed"
                              >
                                {addingToCart === producto.id ? '⏳' : '🛒 Añadir'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#9BA8AB] rounded-2xl p-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#4A5C6A] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#4A5C6A] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#4A5C6A] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-[#9BA8AB] bg-white rounded-b-2xl">
            <form
              onSubmit={e => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex gap-2 items-end"
            >
              <textarea
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="¿Qué productos buscas?"
                className="flex-1 resize-none border border-[#9BA8AB] rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#253745] max-h-32 min-h-[40px]"
                rows={2}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-[#11212D] hover:bg-[#06141B] text-white px-4 py-2 rounded-lg transition disabled:bg-[#4A5C6A] disabled:cursor-not-allowed"
                aria-label="Enviar mensaje"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
            {/* espacio seguro para notch en móviles */}
            <div className="pt-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}
    </>
  )
}
