"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { logOk } from "@/lib/bitacora";

type Props = {
  productoId: number;
  nombre: string;
  precio: number;
  imagen?: string;
  marca?: string;
  stockActual?: number;
};

export default function ProductCard({
  productoId,
  nombre,
  precio,
  imagen,
  marca,
  stockActual = 0,
}: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addToCarrito = async () => {
    setLoading(true);

    try {
      // Verificar si está autenticado
      const authResponse = await fetch("/api/me", { credentials: "include" });

      if (!authResponse.ok) {
        Swal.fire({
          title: "Debes iniciar sesión",
          text: "Para agregar productos al carrito, inicia sesión",
          icon: "info",
          confirmButtonText: "Ir a login",
        }).then(() => {
          router.push("/login");
        });
        setLoading(false);
        return;
      }

      // Agregar al carrito
      const response = await fetch("/api/carrito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productoId, cantidad: 1 }),
      });

      if (response.ok) {
        const userId = Number(localStorage.getItem("auth.userId") ?? 0) || null;
        const ip = localStorage.getItem("auth.ip") ?? null;
        await logOk("Producto Agregado", { userId, ip });
        Swal.fire({
          title: "¡Agregado!",
          text: "Producto agregado al carrito",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        // Disparar evento para actualizar contador del carrito
        window.dispatchEvent(new Event("carrito:changed"));
      } else {
        // Intentar obtener el mensaje de error del backend
        let errorMessage = "No se pudo agregar al carrito";
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Si no se puede parsear, usar mensaje genérico
        }
        Swal.fire("Error", errorMessage, "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "No se pudo agregar al carrito", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#9BA8AB] bg-white shadow-sm hover:shadow-lg transition overflow-hidden group flex flex-col">
      {/* Imagen */}
      <div className="h-40 bg-[#CCD0CF] flex items-center justify-center overflow-hidden">
        {imagen ? (
          <img
            src={imagen}
            alt={nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-xs text-[#4A5C6A]">Imagen no disponible</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 space-y-2">
        <span className="text-xs text-[#253745] font-medium bg-[#CCD0CF] rounded px-2 py-0.5 self-start">
          {marca || "Genérico"}
        </span>

        <h3 className="text-sm font-semibold text-[#11212D] line-clamp-2 flex-1">
          {nombre}
        </h3>

        <p className="text-[#253745] font-bold text-base">
          Bs. {precio.toFixed(2)}
        </p>

        {stockActual > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-green-600">Stock: {stockActual}</p>
            <button
              className="mt-auto w-full bg-[#11212D] text-white rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#06141B] active:bg-[#06141B] transition disabled:bg-[#4A5C6A]"
              onClick={addToCarrito}
              disabled={loading}
            >
              {loading ? "⏳ Agregando..." : "🛒 Agregar"}
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-red-600 font-medium">Sin stock</p>
            <button
              className="mt-auto w-full bg-gray-400 text-white rounded-lg py-2 text-sm font-medium cursor-not-allowed"
              disabled
            >
              No disponible
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
