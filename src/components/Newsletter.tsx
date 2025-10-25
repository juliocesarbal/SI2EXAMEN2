// components/Newsletter.tsx
'use client'
import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState<string>('')
  const [ok, setOk] = useState<boolean>(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Aquí podrías POSTear a /api/newsletter; por ahora solo feedback.
    setOk(true)
    setEmail('')
  }

  return (
    <div className="rounded-2xl border border-[#9BA8AB] p-5 md:p-6">
      <h3 className="font-semibold text-[#11212D]">Recibe ofertas y novedades</h3>
      <p className="text-sm text-[#4A5C6A] mt-1">Descuentos exclusivos, promociones especiales y más.</p>
      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          className="w-full border border-[#9BA8AB] rounded-md px-3 py-2 focus:ring-2 focus:ring-[#253745] outline-none"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />
        <button className="whitespace-nowrap bg-[#11212D] text-white px-3 py-2 rounded-md hover:bg-[#06141B]">
          Suscribirme
        </button>
      </form>
      {ok && <p className="mt-2 text-sm text-[#253745]">¡Listo! Te llegarán nuestras promociones.</p>}
    </div>
  )
}
