export default function Footer() {
  return (
    <footer className="border-t border-[#9BA8AB] bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <h3 className="font-semibold text-[#11212D]">Smart Sales</h3>
          <p className="mt-2 text-sm text-[#4A5C6A]">
            Tu tienda online de confianza. Productos de calidad y entregas rápidas.
          </p>
          <p className="mt-3 text-xs text-[#4A5C6A]">
            * Todos los productos garantizados y verificados.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-[#11212D]">Contáctanos</h3>
          <ul className="mt-2 space-y-1 text-sm text-[#4A5C6A]">
            <li>Tel: +591 700-00000</li>
            <li>WhatsApp: +591 700-00000</li>
            <li>Email: contacto@smartsales.com</li>
            <li>Santa Cruz de la Sierra, Bolivia</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-[#11212D]">Atención</h3>
          <ul className="mt-2 space-y-1 text-sm text-[#4A5C6A]">
            <li>Lun–Vie: 09:00–20:00</li>
            <li>Sáb: 09:00–18:00</li>
            <li>Dom/Feriados: 10:00–14:00</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-[#11212D]">Enlaces</h3>
          <ul className="mt-2 space-y-1 text-sm text-[#4A5C6A]">
            <li><a className="hover:text-[#253745]" href="/productos">Productos</a></li>
            <li><a className="hover:text-[#253745]" href="/account">Mi cuenta</a></li>
            <li><a className="hover:text-[#253745]" href="/login">Ingresar</a></li>
            <li><a className="hover:text-[#253745]" href="/register">Crear cuenta</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#9BA8AB]">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-[#4A5C6A] flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Smart Sales. Todos los derechos reservados.</span>
          <span className="text-[#9BA8AB]">Privacidad · Términos</span>
        </div>
      </div>
    </footer>
  )
}