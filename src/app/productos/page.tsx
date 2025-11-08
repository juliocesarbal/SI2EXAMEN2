"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";

interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  imageUrl?: string; // 👈 Viene directo de S3
  imageKey?: string;
  marca: { nombre: string };
  categoria: { nombre: string };
  precio?: number;
  stockActual?: number;
}

interface Categoria {
  id: number;
  nombre: string;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/public/productos?limit=100`),
          fetch(`/api/public/categorias`),
        ]);

        if (prodRes.ok) {
          const data = await prodRes.json();
          // await logOk("Cargar Productos", { userId, ip });
          console.log("📦 Productos desde API:", data);
          setProductos(data);
        }
        if (catRes.ok) {
          const data = await catRes.json();
          console.log("📂 Categorías desde API:", data);
          setCategorias(data);
        }
      } catch (error) {
        console.error("Error al cargar productos/categorías:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // filtro por búsqueda
  const filtered = productos.filter((p) =>
    p.nombre.toLowerCase().includes(q.toLowerCase())
  );

  // agrupar productos por categoría
  const groupedByCategory: Record<string, Producto[]> = {};
  filtered.forEach((p) => {
    const cat = p.categoria?.nombre || "Otros";
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(p);
  });

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Header con buscador */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-[#11212D]">
            Nuestros productos
          </h1>
          <p className="text-[#4A5C6A] text-sm">
            Explora nuestro catálogo completo de productos de calidad.
          </p>
        </div>

        {/* Barra de búsqueda */}
        <div className="flex justify-center">
          <div className="relative w-full md:w-96">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5C6A]">
              🔍
            </span>
            <input
              className="pl-9 pr-3 py-2 w-full border border-[#9BA8AB] rounded-full shadow-sm focus:ring-2 focus:ring-[#253745] focus:border-[#253745] text-sm"
              placeholder="Buscar producto..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Estados */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border bg-white p-4 space-y-3 shadow-sm"
              >
                <div className="h-32 bg-zinc-200 rounded-lg" />
                <div className="h-4 bg-zinc-200 rounded w-1/2" />
                <div className="h-4 bg-zinc-200 rounded w-2/3" />
                <div className="h-8 bg-zinc-200 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-zinc-500 py-16">
            <p className="text-lg">😕 No encontramos resultados.</p>
            <p className="text-sm mt-1">Prueba con otro término de búsqueda.</p>
          </div>
        ) : (
          <div className="space-y-20">
            {categorias.map((cat) => {
              const productosDeCat = groupedByCategory[cat.nombre];
              if (!productosDeCat || productosDeCat.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-6">
                  {/* Encabezado de categoría */}
                  <div className="flex items-center justify-between relative">
                    <h2 className="text-xl font-bold text-[#11212D] flex items-center gap-3">
                      <span className="px-4 py-1.5 bg-[#CCD0CF] border border-[#9BA8AB] rounded-full shadow-sm">
                        {cat.nombre}
                      </span>
                      <span className="hidden md:block h-[2px] w-200 bg-gradient-to-r from-[#9BA8AB] to-transparent rounded-full" />
                    </h2>
                    <a
                      href={`/productos?cat=${encodeURIComponent(cat.nombre)}`}
                      className="text-sm text-[#253745] hover:underline"
                    >
                      Ver más →
                    </a>
                  </div>

                  {/* Grilla de productos */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {productosDeCat.map((p) => (
                      <ProductCard
                        key={p.id}
                        productoId={p.id}
                        nombre={p.nombre}
                        precio={Number(p.precio) || 0}
                        imagen={p.imageUrl} // 👈 Aquí va directo desde S3
                        marca={p.marca?.nombre}
                        stockActual={p.stockActual}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Nota legal */}
        <p className="text-xs text-[#4A5C6A] border-t border-[#9BA8AB] pt-4 text-center">
          ⚠️ Todos los productos cuentan con garantía y están verificados.
        </p>
      </div>
    </section>
  );
}
