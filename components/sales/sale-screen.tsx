"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Receipt, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { productLabel } from "@/lib/pedidos-config";
import { StoreMode, useProductStore } from "@/lib/store";
import { Ticket } from "@/components/ui/ticket";
import { Chip, ChipRow } from "@/components/chip";
import { useRealtime } from "@/lib/realtime/client";

const money = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Pantalla de venta (menudeo y mayoreo): filtros por categoría, búsqueda y contadores
 * grandes en una sola lista. En teléfono el ticket se abre desde una barra inferior;
 * en escritorio queda fijo a un lado.
 */
export function SaleScreen({
  mode,
  title,
  subtitle,
  customerSection,
}: {
  mode: StoreMode;
  title: string;
  subtitle: string;
  customerSection: React.ReactNode;
}) {
  const products = useProductStore((s) => s.products);
  const storeMode = useProductStore((s) => s.mode);
  const updateProductCount = useProductStore((s) => s.updateProductCount);
  const setMode = useProductStore((s) => s.setMode);
  const loadProductsFromDB = useProductStore((s) => s.loadProductsFromDB);

  useEffect(() => {
    setMode(mode);
    loadProductsFromDB();
  }, [mode, setMode, loadProductsFromDB]);

  // Lee la cantidad actual del store: dos toques seguidos no se pierden
  const bump = (id: string, delta: number) => {
    const current =
      useProductStore.getState().products.find((x) => x.id === id)?.cantidad ?? 0;
    updateProductCount(id, current + delta);
  };

  // Tiempo real: precios y productos nuevos llegan solos y el ticket en curso se conserva
  useRealtime(["catalog"], () => loadProductsFromDB({ merge: true }));

  const [category, setCategory] = useState<string>("todas");
  const [query, setQuery] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const priceOf = (p: (typeof products)[number]) =>
    storeMode === StoreMode.MAYOREO ? p.precioMayoreo : p.precioMenudeo;

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.categoria))].sort(),
    [products]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "todas" || p.categoria === category) &&
        (!q || productLabel(p.categoria, p.nombre).toLowerCase().includes(q))
    );
  }, [products, category, query]);

  const countsByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      if (p.cantidad > 0) m.set(p.categoria, (m.get(p.categoria) ?? 0) + p.cantidad);
    }
    return m;
  }, [products]);

  const items = products.reduce((s, p) => s + p.cantidad, 0);
  const total = products.reduce((s, p) => s + p.cantidad * priceOf(p), 0);

  const accent =
    mode === StoreMode.MAYOREO
      ? "bg-sky-600 text-white"
      : "bg-emerald-600 text-white";

  return (
    <div className="mx-auto max-w-7xl px-3 pb-28 pt-3 sm:px-4 lg:px-8 lg:pb-8 lg:pt-8">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">{title}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", accent)}>
          {mode === StoreMode.MAYOREO ? "Mayoreo" : "Menudeo"}
        </span>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1 space-y-4 lg:max-w-2xl">
          {customerSection}

          {/* Búsqueda y filtros */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar corona, cruz, arco…"
                aria-label="Buscar producto"
                className="h-12 w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-11 text-base text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:ring-white"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Borrar búsqueda"
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <ChipRow label="Categorías">
              {["todas", ...categories].map((c) => (
                <Chip
                  key={c}
                  active={category === c}
                  onClick={() => setCategory(c)}
                  count={c === "todas" ? items : countsByCategory.get(c) ?? 0}
                >
                  {c === "todas" ? "Todas" : capitalize(c)}
                </Chip>
              ))}
            </ChipRow>
          </div>

          {/* Productos */}
          {products.length === 0 ? (
            <p className="py-10 text-center text-zinc-500">Cargando productos…</p>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-zinc-500">
              No hay productos con ese filtro.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2.5 min-[560px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {visible.map((p) => {
                const price = priceOf(p);
                const selected = p.cantidad > 0;
                return (
                  <li
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border p-3 transition",
                      selected
                        ? "border-black bg-zinc-50 shadow-sm dark:border-white dark:bg-zinc-900"
                        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="break-words text-base font-bold leading-tight text-black dark:text-white">
                        {productLabel(p.categoria, p.nombre)}
                      </p>
                      <p className="mt-0.5 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                        {money(price)}
                        {selected && (
                          <span className="ml-2 font-bold text-black dark:text-white">
                            = {money(price * p.cantidad)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Quitar uno de ${productLabel(p.categoria, p.nombre)}`}
                        disabled={!selected}
                        onClick={() => bump(p.id, -1)}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-300 transition active:scale-90 disabled:opacity-30 dark:border-zinc-700"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <span
                        className="w-9 text-center text-xl font-bold tabular-nums"
                        aria-live="polite"
                      >
                        {p.cantidad}
                      </span>
                      <button
                        type="button"
                        aria-label={`Agregar uno de ${productLabel(p.categoria, p.nombre)}`}
                        onClick={() => bump(p.id, 1)}
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white transition active:scale-90 dark:bg-white dark:text-black"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Ticket: hoja a pantalla completa en teléfono, columna fija en escritorio */}
        <div
          className={cn(
            "lg:sticky lg:top-4 lg:block lg:w-80 lg:self-start",
            ticketOpen
              ? "fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 pt-16"
              : "hidden"
          )}
          onClick={(e) => e.target === e.currentTarget && setTicketOpen(false)}
        >
          <button
            type="button"
            aria-label="Cerrar ticket"
            onClick={() => setTicketOpen(false)}
            className="fixed right-3 top-3 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg active:scale-95 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
          <Ticket onSavedChange={setJustSaved} />
        </div>
      </div>

      {/* Barra inferior (solo teléfono) */}
      {!ticketOpen && (items > 0 || justSaved) && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-zinc-800 dark:bg-black/95 lg:hidden">
          <button
            type="button"
            onClick={() => setTicketOpen(true)}
            className="flex h-14 w-full items-center justify-between rounded-2xl bg-black px-5 text-white shadow-lg transition active:scale-[0.99] dark:bg-white dark:text-black"
          >
            <span className="flex items-center gap-2 font-semibold">
              <Receipt className="h-5 w-5" />
              {items > 0
                ? `Ver ticket · ${items} ${items === 1 ? "artículo" : "artículos"}`
                : "Venta guardada · Imprimir"}
            </span>
            {items > 0 && (
              <span className="text-lg font-bold tabular-nums">{money(total)}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
