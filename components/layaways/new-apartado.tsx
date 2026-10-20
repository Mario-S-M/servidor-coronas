"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRealtime } from "@/lib/realtime/client";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type { LayawayDTO } from "@/lib/layaways";
import { productLabel } from "@/lib/pedidos-config";
import { api } from "./layaway-detail";
import { Field, FormShell } from "./form-shell";
import { inputClass, money } from "./ui";

export interface Product {
  id: string;
  nombre: string;
  categoria: string;
  precioMenudeo: number | string;
  incluyeImagen?: boolean;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const load = useCallback(() => {
    api<Product[]>("/api/products")
      .then(setProducts)
      .catch(() => toast.error("No se pudieron cargar los productos"));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  // Tiempo real: precios y productos nuevos, sin tocar lo que se está capturando
  useRealtime(["catalog"], load);
  return products;
}

export function NewApartado({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (l: LayawayDTO) => void;
}) {
  const products = useProducts();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deposit, setDeposit] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () =>
      products
        .filter((p) => (quantities[p.id] ?? 0) > 0)
        .map((p) => ({
          product: p,
          quantity: quantities[p.id],
          subtotal: Number(p.precioMenudeo) * quantities[p.id],
        })),
    [products, quantities]
  );
  const total = selected.reduce((s, i) => s + i.subtotal, 0);
  const depositNumber = Number(deposit) || 0;
  const tooMuch = depositNumber > total;

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.categoria))],
    [products]
  );

  const change = (id: string, delta: number) =>
    setQuantities((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + delta) }));

  const save = async () => {
    setSaving(true);
    try {
      const created = await api<LayawayDTO>("/api/layaways", {
        method: "POST",
        body: JSON.stringify({
          kind: "apartado",
          customerName: name,
          customerPhone: phone || null,
          deposit: depositNumber,
          items: selected.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });
      toast.success("Apartado guardado");
      onCreated(created);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormShell
      title="Nuevo apartado"
      subtitle="Anota quién aparta y cuánto deja"
      onClose={onClose}
      total={total}
      deposit={deposit}
      onDepositChange={setDeposit}
      canSave={!!name.trim() && selected.length > 0 && !tooMuch}
      saving={saving}
      onSave={save}
      saveLabel="Guardar apartado"
      hint={tooMuch ? "El anticipo no puede ser mayor al total." : null}
    >
      <Field label="Nombre de quien aparta">
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

      {categories.map((cat) => (
        <section key={cat}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {cat}
          </h3>
          <ul className="space-y-2">
            {products
              .filter((p) => p.categoria === cat)
              .map((p) => {
                const qty = quantities[p.id] ?? 0;
                return (
                  <li
                    key={p.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                      qty > 0
                        ? "border-black bg-zinc-50 dark:border-white dark:bg-zinc-900"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {productLabel(p.categoria, p.nombre)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {money(Number(p.precioMenudeo))}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Step
                        label={`Quitar ${productLabel(p.categoria, p.nombre)}`}
                        onClick={() => change(p.id, -1)}
                        disabled={qty === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Step>
                      <span className="w-8 text-center text-base font-bold tabular-nums">
                        {qty}
                      </span>
                      <Step
                        label={`Agregar ${productLabel(p.categoria, p.nombre)}`}
                        onClick={() => change(p.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Step>
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </FormShell>
  );
}

export function Step({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white transition active:scale-95 disabled:opacity-30 dark:border-zinc-700 dark:bg-black"
    >
      {children}
    </button>
  );
}
