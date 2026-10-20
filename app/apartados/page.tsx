"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageCheck, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LayawayDTO } from "@/lib/layaways";
import { PRODUCTION_LABEL, PRODUCTION_ORDER } from "@/lib/layaways";
import { LayawayCard } from "@/components/layaways/layaway-card";
import { LayawayDetail, api } from "@/components/layaways/layaway-detail";
import { NewApartado } from "@/components/layaways/new-apartado";
import { NewPedido } from "@/components/layaways/new-pedido";
import { inputClass } from "@/components/layaways/ui";
import { THIS_YEAR, YearSelect } from "@/components/year-select";
import { Pagination, usePagination } from "@/components/pagination";
import { Chip, ChipRow } from "@/components/chip";
import { useRealtime } from "@/lib/realtime/client";

type Tab = "apartado" | "pedido";

const STATUS_FILTERS = [
  { value: "activo", label: "Activos" },
  { value: "entregado", label: "Entregados" },
  { value: "cancelado", label: "Cancelados" },
  { value: "", label: "Todos" },
];

const TABS: { value: Tab; label: string }[] = [
  { value: "apartado", label: "Apartados" },
  { value: "pedido", label: "Pedidos" },
];


function ApartadosContent() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    params.get("tab") === "pedido" ? "pedido" : "apartado"
  );
  const [layaways, setLayaways] = useState<LayawayDTO[]>([]);
  const [status, setStatus] = useState("activo");
  const [addon, setAddon] = useState("");
  const [production, setProduction] = useState("");
  const [addonFilters, setAddonFilters] = useState<{ value: string; label: string }[]>([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState(THIS_YEAR);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LayawayDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const pg = usePagination(
    layaways,
    [tab, status, addon, production, query, year].join("|")
  );

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const qs = new URLSearchParams({ kind: tab, year: String(year) });
      if (status) qs.set("status", status);
      if (tab === "pedido" && addon) qs.set("addon", addon);
      if (tab === "pedido" && production) qs.set("production", production);
      if (query.trim()) qs.set("q", query.trim());
      setLayaways(await api<LayawayDTO[]>(`/api/layaways?${qs}`));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [tab, status, addon, production, query, year]);

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  // Tiempo real: la lista y el registro abierto se actualizan solos, sin spinner
  const selectedId = selected?.id;
  useRealtime(["layaways"], () => {
    load(true);
    if (selectedId) {
      api<LayawayDTO>(`/api/layaways/${selectedId}`)
        .then(setSelected)
        .catch(() => {
          setSelected(null);
          toast.info("Este registro fue eliminado desde otro equipo");
        });
    }
  });

  // Filtros por extra: los que se ofrecen este año, más ramo e imagen
  const loadAddonFilters = useCallback(() => {
    api<{ addons: { key: string; name: string; group: string }[] }>(
      `/api/prices?year=${year}&all=1`
    )
      .then((r) => {
        const filters: { value: string; label: string }[] = [];
        for (const a of r.addons) {
          if (a.group === "extra") filters.push({ value: a.key, label: `Con ${a.name.toLowerCase()}` });
        }
        filters.push({ value: "ramo", label: "Con ramo" }, { value: "imagen", label: "Con imagen" });
        setAddonFilters(filters);
      })
      .catch(() => {});
  }, [year]);
  useEffect(() => {
    loadAddonFilters();
  }, [loadAddonFilters]);
  useRealtime(["catalog"], loadAddonFilters);

  // Abrir un registro desde el historial: /apartados?open=<id>
  const openId = params.get("open");
  useEffect(() => {
    if (!openId) return;
    api<LayawayDTO>(`/api/layaways/${openId}`)
      .then((l) => {
        setTab(l.kind);
        setYear(new Date(l.createdAt).getFullYear());
        setStatus("");
        setSelected(l);
      })
      .catch(() => toast.error("No se encontró el registro"));
  }, [openId]);

  const label = tab === "pedido" ? "pedido" : "apartado";

  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-bold leading-tight text-black sm:text-2xl dark:text-white">
          <PackageCheck className="h-6 w-6" /> Apartados y pedidos
        </h1>
        <YearSelect value={year} onChange={setYear} />
      </div>

      {/* Pestañas */}
      <div
        role="tablist"
        aria-label="Tipo de registro"
        className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-900"
      >
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => {
              setTab(t.value);
              setAddon("");
              setProduction("");
            }}
            className={cn(
              "h-11 rounded-xl text-sm font-bold transition",
              tab === t.value
                ? "bg-white text-black shadow dark:bg-black dark:text-white"
                : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Botón principal: va en la página y no pegado al borde, para que siempre se vea */}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="mb-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 text-base font-bold text-white shadow-md transition active:scale-[0.98] sm:w-auto dark:bg-white dark:text-black"
      >
        <Plus className="h-5 w-5" /> Nuevo {label}
      </button>

      {/* Búsqueda y filtros */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o folio"
          className={cn(inputClass, "pl-11")}
        />
      </div>

      <ChipRow className="mb-2">
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.label}
            active={status === f.value}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Chip>
        ))}
      </ChipRow>

      {tab === "pedido" && (
        <ChipRow className="mb-2">
          {PRODUCTION_ORDER.map((p) => (
            <Chip
              key={p}
              active={production === p}
              onClick={() => setProduction(production === p ? "" : p)}
            >
              {PRODUCTION_LABEL[p]}
            </Chip>
          ))}
        </ChipRow>
      )}

      {tab === "pedido" && (
        <ChipRow className="mb-3">
          {addonFilters.map((f) => (
            <Chip
              key={f.value}
              active={addon === f.value}
              onClick={() => setAddon(addon === f.value ? "" : f.value)}
            >
              {f.label}
            </Chip>
          ))}
        </ChipRow>
      )}

      {/* Lista */}
      {loading ? (
        <p className="py-10 text-center text-sm text-zinc-500">Cargando...</p>
      ) : layaways.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-300 px-4 py-10 text-center dark:border-zinc-700">
          <p className="font-semibold text-black dark:text-white">
            No hay {label}s con estos filtros
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Toca «Nuevo {label}» para registrar el primero.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {pg.pageItems.map((l) => (
              <LayawayCard key={l.id} layaway={l} onOpen={() => setSelected(l)} />
            ))}
          </div>
          <Pagination {...pg} />
        </>
      )}

      {selected && (
        <LayawayDetail
          layaway={selected}
          onClose={() => setSelected(null)}
          onChange={(updated) => {
            setSelected(updated);
            load();
          }}
          onDeleted={() => {
            setSelected(null);
            load();
          }}
        />
      )}
      {creating && tab === "apartado" && (
        <NewApartado
          onClose={() => setCreating(false)}
          onCreated={(l) => {
            setCreating(false);
            setSelected(l);
            load();
          }}
        />
      )}
      {creating && tab === "pedido" && (
        <NewPedido
          onClose={() => setCreating(false)}
          onCreated={(l) => {
            setCreating(false);
            setSelected(l);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function ApartadosPage() {
  return (
    <Suspense fallback={null}>
      <ApartadosContent />
    </Suspense>
  );
}
