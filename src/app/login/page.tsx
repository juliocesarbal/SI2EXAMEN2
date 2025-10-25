"use client";

import { useState } from "react";
import { Mail, Lock, Heart, ShieldCheck } from "lucide-react";
import { logOk, logFail } from "@/lib/bitacora";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data) {
        // 1) guardar en localStorage
        localStorage.setItem("auth.userId", String(data.user?.id));
        localStorage.setItem("auth.email", String(data.user?.email ?? ""));
        localStorage.setItem("auth.ip", String(data.ip ?? ""));

        // 2) registrar bitácora (EXITOSO)
         await logOk("LOGIN", { userId: data.user?.id ?? null, ip: data.ip ?? null });

        // 3) avisar y redirigir
        window.dispatchEvent(new Event("auth:changed"));
        location.assign("/");
      } else {
        const ip = data?.ip ?? null;

        // Registrar bitácora (FALLIDO) con el ip que el backend incluyó
        await logFail("LOGIN", { userId: null, ip });

        setErr(data?.message || "Credenciales inválidas.");
      }
    } catch {
      setErr("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#CCD0CF] to-[#9BA8AB] overflow-hidden">
      <div className="h-full w-full flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">

            <h1 className="text-2xl font-bold text-[#11212D] mt-2">
              Bienvenido de nuevo
            </h1>
            <p className="text-[#4A5C6A] text-sm">
              Ingresa a tu cuenta de Smart Sales y gestiona tus pedidos fácilmente
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="relative block">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-[#4A5C6A]" />
              <input
                className="w-full pl-10 pr-3 py-2 border border-[#9BA8AB] rounded-lg focus:ring-2 focus:ring-[#253745] outline-none"
                placeholder="Correo electrónico"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="relative block">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-[#4A5C6A]" />
              <input
                className="w-full pl-10 pr-3 py-2 border border-[#9BA8AB] rounded-lg focus:ring-2 focus:ring-[#253745] outline-none"
                placeholder="Contraseña"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {err && <p className="text-red-600 text-sm">{err}</p>}

            <button
              className="w-full bg-[#11212D] hover:bg-[#06141B] text-white py-2.5 rounded-lg font-semibold shadow disabled:bg-[#4A5C6A] transition-colors"
              disabled={loading || !email || !password}
            >
              {loading ? "Ingresando…" : "Entrar"}
            </button>
          </form>

         

          <p className="text-sm text-center text-[#4A5C6A]">
            ¿No tienes cuenta?{" "}
            <a className="text-[#253745] hover:text-[#11212D] hover:underline" href="/register">
              Crear cuenta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
