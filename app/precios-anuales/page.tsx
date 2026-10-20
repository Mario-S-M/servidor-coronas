"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Check, Copy, History, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/components/layaways/layaway-detail";
import { inputClass, money } from "@/components/layaways/ui";
import type { AddonPriceRow, ProductPriceRow } from "@/lib/pricing";

interface PricesResponse {
  year: number;
  years: number[];
  products: ProductPriceRow[];
  addons: AddonPriceRow[];
}

interface ColorRow {
  id: string;
  name: string;
}

const thisYear = new Date().getFullYear();

export default function PreciosAnualesPage() {
  const [year, setYear] = useState(thisYear);
  const [data, setData] = useState<PricesResponse | null>(null);
  const [prev, setPrev] = useState<PricesResponse | null>(null);
  const [colors, setColors] = useState<ColorRow[]>([]);
  const [newColor, setNewColor] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cur, before] = await Promise.all([
        api<PricesResponse>(`/api/prices?year=${year}&all=1`),
        api<PricesResponse>(`/api/prices?year=${year - 1}&all=1`),
      ]);
      setData(cur);
      setPrev(before);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    }
  }, [year]);

  const loadColors = useCallback(async () => {
    try {
      setColors(await api<ColorRow[]>("/api/colors"));
    } catch {
      toast.error("No se pudieron cargar los colores");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadColors();
  }, [loadColors]);

  const missing =
    !!data && (data.products.some((p) => !p.exact) || data.addons.some((a) => a.activo && !a.exact));

  const copyFromPrevious = async () => {
    setBusy(true);
    try {
      const r = await api<{ products: number; addons: number }>("/api/prices/copy", {
        method: "POST",
        body: JSON.stringify({ from: year - 1, to: year }),
      });
      toast.success(`Se copiaron ${r.products} productos y ${r.addons} extras de ${year - 1}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const importFromTickets = async () => {
    setBusy(true);
    try {
      const r = await api<{ created: number; partial: string[] }>(
        "/api/prices/import-tickets",
        { method: "POST", body: JSON.stringify({ year }) }
      );
      if (r.created === 0) {
        toast.info(`No hay tickets de ${year} para recuperar precios`);
      } else {
        toast.success(`Se recuperaron ${r.created} precios de los tickets de ${year}`, {
          description: r.partial.length
            ? `Sin tickets de un tipo (se usó el precio actual): ${r.partial.join(", ")}`
            : undefined,
        });
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const addColor = async () => {
    if (!newColor.trim()) return;
    try {
      await api("/api/colors", {
        method: "POST",
        body: JSON.stringify({ name: newColor }),
      });
      setNewColor("");
      await loadColors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  };

  const removeColor = async (id: string) => {
    try {
      await api(`/api/colors/${id}`, { method: "DELETE" });
      await loadColors();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  };

  const years = data?.years ?? [thisYear + 1, thisYear];
  const categories = [...new Set(data?.products.map((p) => p.categoria) ?? [])];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-5 sm:px-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-black dark:text-white">
          <CalendarDays className="h-6 w-6" /> Precios por año
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Cada año guarda sus propios precios. Cambiar uno no modifica los años
          anteriores ni los tickets ya hechos.
        </p>
      </header>

      {/* Selector de año */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            aria-pressed={year === y}
            onClick={() => setYear(y)}
            className={cn(
              "h-11 shrink-0 rounded-full border px-5 text-base font-bold tabular-nums transition active:scale-95",
              year === y
                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-black dark:text-zinc-200"
            )}
          >
            {y}
          </button>
        ))}
      </div>

      {data && missing && (
        <div className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-semibold">
            {year} aún no tiene todos sus precios guardados.
          </p>
          <p>
            Mientras tanto se usan los del año anterior (se marcan abajo). Copia
            los de {year - 1} para empezar o recupéralos de los tickets.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy}
              onClick={copyFromPrevious}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-4 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-black"
            >
              <Copy className="h-4 w-4" /> Copiar de {year - 1}
            </button>
            {year < thisYear && (
              <button
                type="button"
                disabled={busy}
                onClick={importFromTickets}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-400 bg-white px-4 font-semibold text-black transition active:scale-[0.98] disabled:opacity-50 dark:bg-black dark:text-white"
              >
                <History className="h-4 w-4" /> Recuperar de los tickets
              </button>
            )}
          </div>
        </div>
      )}

      {/* Productos */}
      {categories.map((cat) => (
        <section key={cat} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {cat}
          </h2>
          {data?.products
            .filter((p) => p.categoria === cat)
            .map((p) => (
              <ProductCard
                key={`${p.id}-${year}-${p.exact}`}
                row={p}
                year={year}
                previous={prev?.products.find((x) => x.id === p.id) ?? null}
                onSaved={load}
              />
            ))}
        </section>
      ))}

      {/* Extras y tamaños de imagen: se crean, se cambian y se ofrecen por año */}
      {data && (
        <AddonsSection
          year={year}
          addons={data.addons}
          previous={prev?.addons ?? []}
          onSaved={load}
        />
      )}

      {/* Colores */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Colores disponibles
        </h2>
        <ul className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-1 rounded-full border border-zinc-300 bg-white py-1 pl-4 pr-1 text-sm font-medium dark:border-zinc-700 dark:bg-black"
            >
              {c.name}
              <button
                type="button"
                aria-label={`Quitar ${c.name}`}
                onClick={() => removeColor(c.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition active:scale-95 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addColor()}
            placeholder="Nuevo color"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addColor}
            disabled={!newColor.trim()}
            aria-label="Agregar color"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white transition active:scale-95 disabled:opacity-40 dark:bg-white dark:text-black"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}

const cardClass =
  "rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950";

function Inherited({ sourceYear }: { sourceYear: number | null }) {
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
      {sourceYear ? `Precio de ${sourceYear}` : "Precio base"}
    </span>
  );
}

function SaveButton({ dirty, onClick }: { dirty: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={!dirty}
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white transition active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-500 dark:disabled:bg-zinc-800"
    >
      <Check className="h-4 w-4" /> {dirty ? "Guardar" : "Guardado"}
    </button>
  );
}

function PriceInput({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "tabular-nums")}
      />
      {hint && (
        <span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400">
          {hint}
        </span>
      )}
    </label>
  );
}

function ProductCard({
  row,
  year,
  previous,
  onSaved,
}: {
  row: ProductPriceRow;
  year: number;
  previous: ProductPriceRow | null;
  onSaved: () => void;
}) {
  const [menudeo, setMenudeo] = useState(String(row.precioMenudeo));
  const [mayoreo, setMayoreo] = useState(String(row.precioMayoreo));
  const [produccion, setProduccion] = useState(
    row.precioProduccion === null ? "" : String(row.precioProduccion)
  );
  const dirty =
    !row.exact ||
    Number(menudeo) !== row.precioMenudeo ||
    Number(mayoreo) !== row.precioMayoreo ||
    (produccion === "" ? null : Number(produccion)) !== row.precioProduccion;

  const save = async () => {
    try {
      await api("/api/prices/products", {
        method: "PUT",
        body: JSON.stringify({
          productId: row.id,
          year,
          precioMenudeo: Number(menudeo),
          precioMayoreo: Number(mayoreo),
          precioProduccion: produccion === "" ? null : Number(produccion),
        }),
      });
      toast.success(`Precio de ${year} guardado`);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  };

  // Solo se muestra el precio del año anterior si de verdad quedó guardado
  const before = (n: number | null | undefined) =>
    previous?.exact
      ? n === null || n === undefined
        ? `${year - 1}: sin registrar`
        : `${year - 1}: ${money(n)}`
      : `${year - 1}: sin guardar`;

  return (
    <div className={cardClass}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-base font-bold">{row.nombre}</p>
        {!row.exact && <Inherited sourceYear={row.sourceYear} />}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <PriceInput label="Menudeo" value={menudeo} onChange={setMenudeo} hint={before(previous?.precioMenudeo)} />
        <PriceInput label="Mayoreo" value={mayoreo} onChange={setMayoreo} hint={before(previous?.precioMayoreo)} />
        <PriceInput
          label="Producción"
          value={produccion}
          onChange={setProduccion}
          hint={before(previous?.precioProduccion)}
        />
      </div>
      <div className="mt-3">
        <SaveButton dirty={dirty} onClick={save} />
      </div>
    </div>
  );
}

function AddonsSection({
  year,
  addons,
  previous,
  onSaved,
}: {
  year: number;
  addons: AddonPriceRow[];
  previous: AddonPriceRow[];
  onSaved: () => void;
}) {
  const offered = (group: "extra" | "imagen") =>
    addons.filter((a) => a.activo && (group === "imagen" ? a.group === "imagen" : a.group !== "imagen"));
  const removed = addons.filter((a) => !a.activo);

  const setActive = async (key: string, activo: boolean) => {
    try {
      await api("/api/prices/addons", {
        method: "PUT",
        body: JSON.stringify({ key, year, activo }),
      });
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  };

  const block = (group: "extra" | "imagen", title: string) => (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {offered(group).map((a) => (
        <AddonCard
          key={`${a.key}-${year}-${a.exact}-${a.price}-${a.name}`}
          row={a}
          year={year}
          previous={previous.find((x) => x.key === a.key) ?? null}
          onSaved={onSaved}
          onRemove={a.group === "ramo" ? undefined : () => setActive(a.key, false)}
        />
      ))}
      <NewAddonForm year={year} group={group} onCreated={onSaved} />
    </section>
  );

  return (
    <>
      {block("extra", "Extras de los pedidos")}
      {block("imagen", "Tamaños de imagen")}
      {removed.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            No se ofrecen en {year}
          </h2>
          <ul className="space-y-2">
            {removed.map((a) => (
              <li
                key={a.key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700"
              >
                <span className="min-w-0 truncate font-medium">{a.name}</span>
                <button
                  type="button"
                  onClick={() => setActive(a.key, true)}
                  className="h-10 shrink-0 rounded-xl border border-zinc-300 px-4 text-sm font-semibold transition active:scale-95 dark:border-zinc-700"
                >
                  Ofrecer en {year}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function NewAddonForm({
  year,
  group,
  onCreated,
}: {
  year: number;
  group: "extra" | "imagen";
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const label = group === "imagen" ? "tamaño de imagen" : "extra";

  const create = async () => {
    try {
      await api("/api/addons", {
        method: "POST",
        body: JSON.stringify({ name, group, price: Number(price), year }),
      });
      toast.success(`Se agregó "${name}" para ${year}`);
      setName("");
      setPrice("");
      setOpen(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 font-semibold transition active:scale-[0.98] dark:border-zinc-700"
      >
        <Plus className="h-4 w-4" /> Nuevo {label}
      </button>
    );
  }
  return (
    <div className={cardClass}>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Nombre
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={group === "imagen" ? "Ej. Extragrande" : "Ej. Moño"}
            className={inputClass}
          />
        </label>
        <PriceInput label={`Precio ${year}`} value={price} onChange={setPrice} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 rounded-xl border border-zinc-300 font-semibold dark:border-zinc-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!name.trim() || price === ""}
          onClick={create}
          className="h-11 rounded-xl bg-emerald-600 font-semibold text-white disabled:opacity-40"
        >
          Agregar
        </button>
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">
        Solo se ofrecerá desde {year}. En otros años se activa por separado.
      </p>
    </div>
  );
}

function AddonCard({
  row,
  year,
  previous,
  onSaved,
  onRemove,
}: {
  row: AddonPriceRow;
  year: number;
  previous: AddonPriceRow | null;
  onSaved: () => void;
  onRemove?: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [price, setPrice] = useState(String(row.price));
  const dirty = !row.exact || Number(price) !== row.price || name !== row.name;

  const save = async () => {
    try {
      await api("/api/prices/addons", {
        method: "PUT",
        body: JSON.stringify({ key: row.key, year, name, price: Number(price) }),
      });
      toast.success(`Precio de ${year} guardado`);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  };

  const before = previous?.activo && previous.exact
    ? `${year - 1}: ${money(previous.price)}`
    : `${year - 1}: sin guardar`;

  return (
    <div className={cardClass}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Nombre del extra"
          className="min-w-0 flex-1 bg-transparent text-base font-bold focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        />
        {!row.exact && <Inherited sourceYear={row.sourceYear} />}
      </div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <PriceInput label="Precio" value={price} onChange={setPrice} hint={before} />
        <div className="w-32">
          <SaveButton dirty={dirty} onClick={save} />
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-3 h-10 w-full rounded-xl border border-red-300 text-sm font-semibold text-red-700 transition active:scale-[0.98] dark:border-red-500/40 dark:text-red-300"
        >
          Quitar en {year}
        </button>
      )}
    </div>
  );
}
