"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Truck,
  Bell,
  ShieldCheck,
  Percent
} from "lucide-react";

type Form = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

export default function RegisterPage() {
  const [form, setForm] = useState<Form>({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [optIn, setOptIn] = useState(true);
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  function scorePassword(pw: string) {
    let score = 0;
    if (pw.length >= 6) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0..3
  }

  const passScore = useMemo(() => scorePassword(form.password), [form.password]);
  const passLabel =
    passScore === 0 ? "Muy débil" : passScore === 1 ? "Débil" : passScore === 2 ? "Aceptable" : "Fuerte";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/public/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, optIn }),
      });
      if (res.ok) {
        router.push("/login");
      } else {
        const text = await res.text();
        setErr(text || "No se pudo registrar.");
      }
    } catch {
      setErr("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const disabled =
    !form.email ||
    !form.firstName ||
    !form.lastName ||
    form.password.length < 6 ||
    loading;

  return (
    // Permite scroll en pantallas pequeñas + padding seguro (titulo no se corta)
    <div className="fixed inset-0 bg-gradient-to-br mt-14 from-[#CCD0CF] to-[#9BA8AB] overflow-y-auto sm:overflow-hidden">
      <div className="min-h-full w-full flex items-start sm:items-center justify-center px-4 py-6 sm:py-0 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header cálido */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-[#11212D]">Crea tu cuenta</h1>
            <p className="text-[#4A5C6A] text-sm">Únete a Smart Sales y accede a ofertas, recordatorios y envíos rápidos</p>
          </div>

          {/* Beneficios compactos (chips) */}
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-[#253745] bg-[#CCD0CF] border border-[#9BA8AB] rounded-lg px-3 py-2 text-xs">
              <Percent className="w-4 h-4" /> Ofertas exclusivas
            </div>
            <div className="flex items-center gap-2 text-[#253745] bg-[#CCD0CF] border border-[#9BA8AB] rounded-lg px-3 py-2 text-xs">
              <ShieldCheck className="w-4 h-4" /> Compras seguras
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="relative block">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-[#4A5C6A]" />
              <input
                className="w-full pl-10 pr-3 py-2 border border-[#9BA8AB] rounded-lg focus:ring-2 focus:ring-[#253745] outline-none"
                placeholder="Correo electrónico"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="relative block">
                <User className="absolute left-3 top-3 h-5 w-5 text-[#4A5C6A]" />
                <input
                  className="w-full pl-10 pr-3 py-2 border border-[#9BA8AB] rounded-lg focus:ring-2 focus:ring-[#253745] outline-none"
                  placeholder="Nombre"
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  required
                  autoComplete="given-name"
                />
              </label>

              <label className="relative block">
                <User className="absolute left-3 top-3 h-5 w-5 text-[#4A5C6A]" />
                <input
                  className="w-full pl-10 pr-3 py-2 border border-[#9BA8AB] rounded-lg focus:ring-2 focus:ring-[#253745] outline-none"
                  placeholder="Apellido"
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  required
                  autoComplete="family-name"
                />
              </label>
            </div>

            <label className="relative block">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-[#4A5C6A]" />
              <input
                className="w-full pl-10 pr-10 py-2 border border-[#9BA8AB] rounded-lg focus:ring-2 focus:ring-[#253745] outline-none"
                placeholder="Contraseña (mín. 6)"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-2.5 p-1 text-[#4A5C6A] hover:text-[#11212D]"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </label>

            {/* Barra fuerza contraseña (compacta) */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {[0,1,2].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-10 rounded-full ${passScore > i ? "bg-[#253745]" : "bg-[#CCD0CF]"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-[#4A5C6A]">{passLabel}</span>
            </div>

            {/* Opt-in y confianza */}
            <label className="flex items-center gap-2 text-sm text-[#11212D]">
              <input
                type="checkbox"
                className="rounded border-[#9BA8AB]"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
              />
              Quiero recibir ofertas y recordatorios personalizados
            </label>

            {err && <p className="text-red-600 text-sm" aria-live="polite">{err}</p>}

            <button
              className="w-full bg-[#11212D] hover:bg-[#06141B] text-white py-2.5 rounded-lg font-semibold shadow disabled:bg-[#4A5C6A] transition-colors"
              disabled={disabled}
            >
              {loading ? "Creando cuenta…" : "Crear cuenta gratis"}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-[#4A5C6A]">
              <CheckCircle2 className="w-4 h-4 text-[#253745]" />
              Cancelas cuando quieras
            </div>

            <p className="text-xs text-[#4A5C6A] text-center">
              Al registrarte aceptas nuestros <a href="/terms" className="text-[#253745] hover:text-[#11212D] hover:underline">Términos</a> y <a href="/privacy" className="text-[#253745] hover:text-[#11212D] hover:underline">Política de Privacidad</a>.
            </p>

            <p className="text-sm text-center text-[#4A5C6A]">
              ¿Ya tienes cuenta?{" "}
              <a className="text-[#253745] hover:text-[#11212D] hover:underline" href="/login">
                Inicia sesión
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}