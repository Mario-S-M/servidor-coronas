"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRealtime } from "@/lib/realtime/client";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LayawayDTO } from "@/lib/layaways";
import { RAMO_KEY, productLabel } from "@/lib/pedidos-config";
import type { AddonPriceRow } from "@/lib/pricing";
import { api } from "./layaway-detail";
import { Field, FormShell } from "./form-shell";
import { useProducts } from "./new-apartado";
import { inputClass, money } from "./ui";

interface Ramo {
  uid: number;
  cantidad: number;
  flor: string;
  color: string;
}

interface Draft {
  uid: number;
  categoria: string;
  productId: string;
  colors: string[];
  colorInput: string;
  extras: string[];
  ramos: Ramo[];
  conImagen: boolean;
  imageSize: string | null;
  imagenDesc: string;
  cromoDesc: string;
}

let nextUid = 1;
const emptyDraft = (categoria = ""): Draft => ({
  uid: nextUid++,
  categoria,
  productId: "",
  colors: [],
  colorInput: "",
  extras: [],
  ramos: [],
  conImagen: false,
  imageSize: null,
  imagenDesc: "",
  cromoDesc: "",
});

export function NewPedido({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (l: LayawayDTO) => void;
}) {
  const products = useProducts();
  const [addons, setAddons] = useState<AddonPriceRow[]>([]);
  const [colorCatalog, setColorCatalog] = useState<string[]>([]);
  const loadCatalog = useCallback(() => {
    // Extras, precios y colores se administran en "Precios por año"
    api<{ addons: AddonPriceRow[] }>("/api/prices")
      .then((r) => setAddons(r.addons))
      .catch(() => toast.error("No se pudieron cargar los extras"));
    api<{ name: string }[]>("/api/colors")
      .then((r) => setColorCatalog(r.map((c) => c.name)))
      .catch(() => toast.error("No se pudieron cargar los colores"));
  }, []);
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);
  // Tiempo real: si cambian precios o extras, se actualizan sin borrar las coronas capturadas
  useRealtime(["catalog"], loadCatalog);

  const extras = addons.filter((a) => a.group === "extra");
  const ramo = addons.find((a) => a.group === "ramo");
  const imageSizes = addons.filter((a) => a.group === "imagen");
  const minImage = imageSizes.length
    ? Math.min(...imageSizes.map((s) => s.price))
    : 0;

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.categoria))],
    [products]
  );

  const [drafts, setDrafts] = useState<Draft[]>(() => [emptyDraft()]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deposit, setDeposit] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (uid: number, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.uid === uid ? { ...d, ...patch } : d)));

  // Las coronas que ya traen imagen no la cobran; solo se anota el santo
  const includesImage = (d: Draft) =>
    !!products.find((p) => p.id === d.productId)?.incluyeImagen;

  const priceOf = (d: Draft) => {
    const base = Number(products.find((p) => p.id === d.productId)?.precioMenudeo ?? 0);
    const extrasTotal = d.extras.reduce(
      (s, key) => s + (extras.find((e) => e.key === key)?.price ?? 0),
      0
    );
    const ramosTotal = d.ramos.reduce((s, r) => s + r.cantidad, 0) * (ramo?.price ?? 0);
    const image = d.conImagen && !includesImage(d)
      ? imageSizes.find((s) => s.key === d.imageSize)?.price ?? 0
      : 0;
    return base + extrasTotal + ramosTotal + image;
  };

  const total = drafts.reduce((s, d) => s + priceOf(d), 0);
  const depositNumber = Number(deposit) || 0;
  const tooMuch = depositNumber > total;

  const draftOk = (d: Draft) =>
    !!d.productId &&
    d.colors.length > 0 &&
    d.ramos.every((r) => r.flor.trim() && r.color.trim()) &&
    (includesImage(d)
      ? !!d.imagenDesc.trim()
      : !d.conImagen || (!!d.imageSize && !!d.imagenDesc.trim()));
  const allOk = drafts.length > 0 && drafts.every(draftOk);

  const addColor = (d: Draft, raw: string) => {
    const color = raw.trim();
    if (!color) return;
    if (d.colors.some((c) => c.toLowerCase() === color.toLowerCase())) {
      update(d.uid, { colorInput: "" });
      return;
    }
    update(d.uid, { colors: [...d.colors, color], colorInput: "" });
  };

  const save = async () => {
    setSaving(true);
    try {
      const created = await api<LayawayDTO>("/api/layaways", {
        method: "POST",
        body: JSON.stringify({
          kind: "pedido",
          customerName: name,
          customerPhone: phone || null,
          deposit: depositNumber,
          items: drafts.map((d) => ({
            productId: d.productId,
            quantity: 1,
            colors: d.colors,
            imagenDesc: d.conImagen || includesImage(d) ? d.imagenDesc : null,
            cromoDesc: d.conImagen || includesImage(d) ? d.cromoDesc : null,
            addons: [
              ...d.extras.map((key) => ({ key })),
              ...d.ramos.map((r) => ({
                key: RAMO_KEY,
                quantity: r.cantidad,
                flor: r.flor,
                color: r.color,
              })),
              ...(d.conImagen && !includesImage(d) && d.imageSize
                ? [{ key: d.imageSize }]
                : []),
            ],
          })),
        }),
      });
      toast.success("Pedido guardado");
      onCreated(created);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const santoFields = (d: Draft) => (
    <>
      <Field label="Santo o imagen">
        <input
          value={d.imagenDesc}
          onChange={(e) => update(d.uid, { imagenDesc: e.target.value })}
          placeholder="Ej. San Judas Tadeo"
          className={inputClass}
        />
      </Field>
      <Field label="Cromo (opcional)">
        <input
          value={d.cromoDesc}
          onChange={(e) => update(d.uid, { cromoDesc: e.target.value })}
          placeholder="Ej. Sagrado Corazón"
          className={inputClass}
        />
      </Field>
    </>
  );

  return (
    <FormShell
      title="Nuevo pedido"
      subtitle="Cada corona lleva sus propios colores, flores y extras"
      onClose={onClose}
      total={total}
      deposit={deposit}
      onDepositChange={setDeposit}
      canSave={!!name.trim() && allOk && !tooMuch}
      saving={saving}
      onSave={save}
      saveLabel="Guardar pedido"
      hint={
        tooMuch
          ? "El anticipo no puede ser mayor al total."
          : !allOk
          ? "Cada corona necesita tipo y al menos un color (y flor y color en cada ramo; santo o imagen, y tamaño si es extra)."
          : null
      }
    >
      <Field label="Nombre de quien pide">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          autoComplete="off"
          className={inputClass}
        />
      </Field>
      <Field label="Teléfono (opcional)">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="10 dígitos"
          className={inputClass}
        />
      </Field>

      {drafts.map((d, idx) => {
        const inCategory = products.filter((p) => p.categoria === d.categoria);
        const suggestions = colorCatalog.filter(
          (c) => !d.colors.some((x) => x.toLowerCase() === c.toLowerCase())
        );
        return (
          <section
            key={d.uid}
            className="space-y-5 rounded-2xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-500/30 dark:bg-violet-500/5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-violet-900 dark:text-violet-200">
                Corona {idx + 1}
              </h3>
              <div className="flex items-center gap-3">
                <span className="font-bold tabular-nums">{money(priceOf(d))}</span>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Quitar corona ${idx + 1}`}
                    onClick={() =>
                      setDrafts((ds) => ds.filter((x) => x.uid !== d.uid))
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition active:scale-95 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Tipo: primero la categoría y luego el tamaño o modelo */}
            <Field label="Tipo">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <Pill
                    key={cat}
                    small
                    active={d.categoria === cat}
                    onClick={() =>
                      update(d.uid, {
                        categoria: cat,
                        productId: d.categoria === cat ? d.productId : "",
                      })
                    }
                  >
                    {cat}
                  </Pill>
                ))}
              </div>
              {d.categoria && (
                <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-3">
                  {inCategory.map((p) => (
                    <Pill
                      key={p.id}
                      active={d.productId === p.id}
                      onClick={() =>
                        update(d.uid, {
                          productId: p.id,
                          ...(p.incluyeImagen && { conImagen: false, imageSize: null }),
                        })
                      }
                    >
                      <span>{productLabel(p.categoria, p.nombre)}</span>
                      <span className="text-xs font-normal opacity-70">
                        {money(Number(p.precioMenudeo))}
                      </span>
                    </Pill>
                  ))}
                </div>
              )}
            </Field>

            {/* Colores: los que quieras, escritos a mano */}
            <Field label="Colores">
              {d.colors.length > 0 && (
                <ul className="mb-2 flex flex-wrap gap-1.5">
                  {d.colors.map((c) => (
                    <li
                      key={c}
                      className="flex items-center gap-1 rounded-full bg-violet-600 py-1 pl-3 pr-1 text-sm font-semibold text-white"
                    >
                      {c}
                      <button
                        type="button"
                        aria-label={`Quitar ${c}`}
                        onClick={() =>
                          update(d.uid, {
                            colors: d.colors.filter((x) => x !== c),
                          })
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full transition active:scale-95 hover:bg-white/20"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input
                  value={d.colorInput}
                  onChange={(e) => update(d.uid, { colorInput: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addColor(d, d.colorInput);
                    }
                  }}
                  placeholder="Escribe un color, ej. Morado fuerte"
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={!d.colorInput.trim()}
                  onClick={() => addColor(d, d.colorInput)}
                  aria-label="Agregar color"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white transition active:scale-95 disabled:opacity-40 dark:bg-white dark:text-black"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => addColor(d, c)}
                      className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium transition active:scale-95 dark:border-zinc-700 dark:bg-black"
                    >
                      + {c}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                Los colores nuevos se guardan en tu lista para la próxima vez.
              </p>
            </Field>

            {/* Ramos de flores: cantidad, flor y color de cada línea */}
            {ramo && (
              <Field label={`${ramo.name} (${money(ramo.price)} cada uno)`}>
                <ul className="space-y-3">
                  {d.ramos.map((r, i) => {
                    const patch = (p: Partial<Ramo>) =>
                      update(d.uid, {
                        ramos: d.ramos.map((x) => (x.uid === r.uid ? { ...x, ...p } : x)),
                      });
                    return (
                      <li
                        key={r.uid}
                        className="space-y-2 rounded-xl border border-zinc-300 bg-white p-3 dark:border-zinc-700 dark:bg-black"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1" role="group" aria-label={`Cantidad de ramos de la línea ${i + 1}`}>
                            <button
                              type="button"
                              aria-label="Menos ramos"
                              disabled={r.cantidad <= 1}
                              onClick={() => patch({ cantidad: r.cantidad - 1 })}
                              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 transition active:scale-95 disabled:opacity-40 dark:border-zinc-700"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-16 text-center text-sm font-bold tabular-nums">
                              {r.cantidad} {r.cantidad === 1 ? "ramo" : "ramos"}
                            </span>
                            <button
                              type="button"
                              aria-label="Más ramos"
                              onClick={() => patch({ cantidad: Math.min(50, r.cantidad + 1) })}
                              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 transition active:scale-95 dark:border-zinc-700"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold tabular-nums">
                              {money(ramo.price * r.cantidad)}
                            </span>
                            <button
                              type="button"
                              aria-label={`Quitar línea de ramos ${i + 1}`}
                              onClick={() =>
                                update(d.uid, { ramos: d.ramos.filter((x) => x.uid !== r.uid) })
                              }
                              className="flex h-11 w-11 items-center justify-center rounded-xl text-red-600 transition active:scale-95 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={r.flor}
                            onChange={(e) => patch({ flor: e.target.value })}
                            placeholder="Flor, ej. Lirios"
                            aria-label="Nombre de la flor"
                            className={inputClass}
                          />
                          <input
                            value={r.color}
                            onChange={(e) => patch({ color: e.target.value })}
                            list="colores-ramo"
                            placeholder="Color, ej. Rosa"
                            aria-label="Color de la flor"
                            className={inputClass}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <datalist id="colores-ramo">
                  {colorCatalog.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={() =>
                    update(d.uid, {
                      ramos: [...d.ramos, { uid: nextUid++, cantidad: 1, flor: "", color: "" }],
                    })
                  }
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 text-sm font-semibold transition active:scale-[0.98] dark:border-zinc-700"
                >
                  <Plus className="h-4 w-4" /> Agregar ramos
                </button>
              </Field>
            )}

            {/* Extras configurables (pata, moño, etc.) */}
            {extras.length > 0 && (
              <Field label="Extras">
                <div className="grid grid-cols-2 gap-2">
                  {extras.map((e) => (
                    <Pill
                      key={e.key}
                      active={d.extras.includes(e.key)}
                      onClick={() =>
                        update(d.uid, {
                          extras: d.extras.includes(e.key)
                            ? d.extras.filter((k) => k !== e.key)
                            : [...d.extras, e.key],
                        })
                      }
                    >
                      <span>{e.name}</span>
                      <span className="text-xs font-normal opacity-70">
                        +{money(e.price)}
                      </span>
                    </Pill>
                  ))}
                </div>
              </Field>
            )}

            {/* Imagen: incluida en la corona (sin costo) o extra con precio por tamaño */}
            {d.productId && includesImage(d) && (
              <div className="space-y-4 rounded-xl border border-dashed border-emerald-400 p-3 dark:border-emerald-500/40">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Imagen incluida · sin costo
                </p>
                {santoFields(d)}
              </div>
            )}
            {d.productId && !includesImage(d) && imageSizes.length > 0 && (
              <div className="space-y-3">
                <Pill
                  active={d.conImagen}
                  onClick={() =>
                    update(d.uid, {
                      conImagen: !d.conImagen,
                      imageSize: d.conImagen ? null : d.imageSize,
                    })
                  }
                >
                  <span>Lleva imagen (extra)</span>
                  <span className="text-xs font-normal opacity-70">
                    desde {money(minImage)}
                  </span>
                </Pill>

                {d.conImagen && (
                  <div className="space-y-4 rounded-xl border border-dashed border-violet-300 p-3 dark:border-violet-500/40">
                    <Field label="Tamaño de la imagen">
                      <div className="grid grid-cols-3 gap-2">
                        {imageSizes.map((s) => (
                          <Pill
                            key={s.key}
                            active={d.imageSize === s.key}
                            onClick={() => update(d.uid, { imageSize: s.key })}
                          >
                            <span>{s.name.replace(/^imagen\s+/i, "")}</span>
                            <span className="text-xs font-normal opacity-70">
                              +{money(s.price)}
                            </span>
                          </Pill>
                        ))}
                      </div>
                    </Field>
                    {santoFields(d)}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      <button
        type="button"
        onClick={() => setDrafts((ds) => [...ds, emptyDraft()])}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 font-semibold transition active:scale-[0.98] dark:border-zinc-700"
      >
        <Plus className="h-4 w-4" /> Agregar otra corona
      </button>
    </FormShell>
  );
}

function Pill({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-xl border px-2 py-2 text-sm font-semibold leading-tight transition active:scale-[0.98]",
        small ? "min-h-10 w-auto rounded-full px-4" : "min-h-12",
        active
          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          : "border-zinc-300 bg-white text-black dark:border-zinc-700 dark:bg-black dark:text-white"
      )}
    >
      {children}
    </button>
  );
}
