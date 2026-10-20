"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PrintButton } from "@/components/print-button";
import {
  PRODUCTION_LABEL,
  PRODUCTION_ORDER,
  layawayToTicketData,
  type LayawayDTO,
} from "@/lib/layaways";
import { layawayTicketLines } from "@/lib/printing/tickets";
import {
  KindChip,
  PRODUCTION_STYLES,
  PaidBar,
  ProductionChip,
  StatusChip,
  formatDate,
  formatTime,
  inputClass,
  money,
} from "./ui";

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error desconocido");
  return data as T;
}

const actionBtn =
  "h-11 rounded-xl border px-3 text-sm font-semibold transition active:scale-[0.98]";

export function LayawayDetail({
  layaway: l,
  onClose,
  onChange,
  onDeleted,
}: {
  layaway: LayawayDTO;
  onClose: () => void;
  onChange: (l: LayawayDTO) => void;
  onDeleted: () => void;
}) {
  const [amount, setAmount] = useState("");

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  };

  const addPayment = () =>
    run(async () => {
      const updated = await api<LayawayDTO>(`/api/layaways/${l.id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) }),
      });
      setAmount("");
      toast.success("Abono registrado");
      onChange(updated);
    });

  const setProduction = (next: string) =>
    run(async () => {
      onChange(
        await api<LayawayDTO>(`/api/layaways/${l.id}`, {
          method: "PATCH",
          body: JSON.stringify({ production: next }),
        })
      );
      toast.success(`Pedido: ${PRODUCTION_LABEL[next as LayawayDTO["production"]]}`);
    });

  const setStatus = (next: string) =>
    run(async () => {
      onChange(
        await api<LayawayDTO>(`/api/layaways/${l.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: next }),
        })
      );
    });

  const remove = () =>
    run(async () => {
      if (!confirm("¿Eliminar este registro?")) return;
      await api(`/api/layaways/${l.id}`, { method: "DELETE" });
      onDeleted();
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[100dvh] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 rounded-none p-0 sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-2xl">
        {/* Encabezado */}
        <div className="border-b border-zinc-200 px-4 py-3 pr-12 dark:border-zinc-800">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <KindChip kind={l.kind} />
            <StatusChip status={l.status} />
            {l.kind === "pedido" && l.status === "activo" && (
              <ProductionChip production={l.production} />
            )}
          </div>
          <DialogTitle className="truncate text-xl font-bold">
            {l.customerName}
          </DialogTitle>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {l.folio} · {formatDate(l.createdAt)} · {formatTime(l.createdAt)}
            {l.customerPhone ? ` · ${l.customerPhone}` : ""}
          </p>
        </div>

        {/* Contenido */}
        <div className="space-y-5 overflow-y-auto px-4 py-4 text-sm text-black dark:text-white">
          {/* Resumen de pago */}
          <section className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Total" value={money(l.total)} />
              <Stat label="Pagado" value={money(l.paid)} />
              <Stat label="Saldo" value={money(l.balance)} strong />
            </div>
            <div className="mt-3">
              <PaidBar paid={l.paid} total={l.total} />
            </div>
          </section>

          {/* Etapa de elaboración (solo pedidos) */}
          {l.kind === "pedido" && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Elaboración
              </h3>
              <div
                role="group"
                aria-label="Etapa del pedido"
                className="grid grid-cols-3 gap-2"
              >
                {PRODUCTION_ORDER.map((step) => (
                  <button
                    key={step}
                    type="button"
                    aria-pressed={l.production === step}
                    disabled={l.production === step}
                    onClick={() => setProduction(step)}
                    className={`flex min-h-12 items-center justify-center rounded-xl border px-1 text-center text-sm font-semibold leading-tight transition active:scale-[0.98] ${
                      l.production === step
                        ? `border-transparent ${PRODUCTION_STYLES[step]}`
                        : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-black dark:text-zinc-200"
                    }`}
                  >
                    {PRODUCTION_LABEL[step]}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Productos */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {l.kind === "pedido" ? "Coronas del pedido" : "Productos"}
            </h3>
            <ul className="space-y-2">
              {l.items.map((i) => (
                <li
                  key={i.id}
                  className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">
                      {l.kind === "apartado" && `${i.quantity} × `}
                      {i.productName}
                    </p>
                    <p className="font-bold tabular-nums">
                      {money(i.totalPrice)}
                    </p>
                  </div>
                  {l.kind === "pedido" && (
                    <dl className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                      <Spec label="Colores" value={i.color} />
                      <Spec label="Flores" value={i.flores} />
                      <Spec label="Santo / imagen" value={i.imagenDesc} />
                      <Spec label="Cromo" value={i.cromoDesc} />
                      <div className="flex justify-between">
                        <dt className="text-zinc-500">Base</dt>
                        <dd className="tabular-nums">{money(i.unitPrice)}</dd>
                      </div>
                      {i.addons.map((a) => (
                        <div
                          key={a.id}
                          className="flex justify-between font-medium text-violet-700 dark:text-violet-300"
                        >
                          <dt className="min-w-0">
                            + {a.quantity > 1 ? `${a.quantity} × ` : ""}
                            {a.name}
                            {a.detail ? `: ${a.detail}` : ""}
                          </dt>
                          <dd className="tabular-nums">{money(a.price)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Abonos */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Abonos
            </h3>
            {l.payments.length === 0 ? (
              <p className="text-zinc-500">Sin abonos.</p>
            ) : (
              <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {l.payments.map((p, idx) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2.5"
                  >
                    <span>
                      <span className="font-medium">
                        {idx === 0 ? "Anticipo" : "Abono"}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {formatDate(p.createdAt)} · {formatTime(p.createdAt)}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {money(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {l.status === "activo" && l.balance > 0 && (
              <div className="mt-3 flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Monto del abono"
                  className={inputClass}
                  aria-label="Monto del abono"
                />
                <button
                  type="button"
                  disabled={!Number(amount)}
                  onClick={addPayment}
                  className="h-12 shrink-0 rounded-xl bg-emerald-600 px-5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  Abonar
                </button>
              </div>
            )}
          </section>

          {/* Estado */}
          {l.status === "activo" && l.balance > 0 && (
            <p className="-mb-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
              Falta cobrar {money(l.balance)} para poder entregar.
            </p>
          )}
          <section className="grid grid-cols-2 gap-2">
            {l.status === "activo" ? (
              <>
                <button
                  type="button"
                  disabled={l.balance > 0}
                  onClick={() => setStatus("entregado")}
                  className={`${actionBtn} border-transparent bg-emerald-600 text-white disabled:opacity-40`}
                >
                  Marcar entregado
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("cancelado")}
                  className={`${actionBtn} border-zinc-300 dark:border-zinc-700`}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setStatus("activo")}
                className={`${actionBtn} border-zinc-300 dark:border-zinc-700`}
              >
                Reactivar
              </button>
            )}
            <button
              type="button"
              onClick={remove}
              className={`${actionBtn} border-red-300 text-red-700 dark:border-red-500/40 dark:text-red-300`}
            >
              Eliminar
            </button>
          </section>
        </div>

        {/* Barra inferior fija: imprimir */}
        <div className="border-t border-zinc-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 dark:border-zinc-800 dark:bg-black">
          <PrintButton
            lines={layawayTicketLines(layawayToTicketData(l))}
            label="Imprimir ticket"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={`tabular-nums ${
          strong ? "text-xl font-bold" : "text-base font-semibold"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
