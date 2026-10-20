"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, PackageCheck, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrintButton } from "@/components/print-button";
import type { LayawayDTO } from "@/lib/layaways";
import {
  formatTicketDate,
  formatTicketTime,
  layawayTicketLines,
} from "@/lib/printing/tickets";

interface Product {
  id: string;
  nombre: string;
  categoria: string;
  precioMenudeo: number | string;
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white text-sm bg-white dark:bg-black text-black dark:text-white";

const money = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

const STATUS_FILTERS = [
  { value: "activo", label: "Activos" },
  { value: "entregado", label: "Entregados" },
  { value: "cancelado", label: "Cancelados" },
  { value: "", label: "Todos" },
];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error desconocido");
  return data as T;
}

const ticketData = (l: LayawayDTO) => ({
  folio: l.folio,
  date: new Date(l.createdAt),
  customerName: l.customerName,
  total: l.total,
  deposit: l.deposit,
  items: l.items.map((i) => ({
    name: i.productName,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    totalPrice: i.totalPrice,
  })),
});

export default function ApartadosPage() {
  const [layaways, setLayaways] = useState<LayawayDTO[]>([]);
  const [status, setStatus] = useState("activo");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LayawayDTO | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (query.trim()) params.set("q", query.trim());
      setLayaways(await api<LayawayDTO[]>(`/api/layaways?${params}`));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [status, query]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const replace = (updated: LayawayDTO) => {
    setSelected(updated);
    load();
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white flex items-center gap-2">
          <PackageCheck className="h-6 w-6" /> Apartados
        </h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo apartado
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o folio"
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.label}
              size="sm"
              variant={status === f.value ? "default" : "outline"}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-500 py-8">Cargando...</p>
      ) : layaways.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-8">
          No hay apartados.
        </p>
      ) : (
        <div className="space-y-2">
          {layaways.map((l) => {
            const date = new Date(l.createdAt);
            return (
              <Card
                key={l.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => setSelected(l)}
              >
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-black dark:text-white truncate">
                      {l.customerName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {l.folio} · {formatTicketDate(date)}{" "}
                      {formatTicketTime(date)}
                    </p>
                  </div>
                  <div className="text-right text-sm shrink-0">
                    <p className="text-black dark:text-white">
                      Dejó {money(l.deposit)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Saldo {money(l.balance)}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {l.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <DetailDialog
          layaway={selected}
          onClose={() => setSelected(null)}
          onChange={replace}
          onDeleted={() => {
            setSelected(null);
            load();
          }}
        />
      )}
      {creating && (
        <NewLayawayDialog
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

function DetailDialog({
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
  const date = new Date(l.createdAt);

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  };

  const addPayment = () =>
    run(async () => {
      const updated = await api<LayawayDTO>(
        `/api/layaways/${l.id}/payments`,
        { method: "POST", body: JSON.stringify({ amount: Number(amount) }) }
      );
      setAmount("");
      toast.success("Abono registrado");
      onChange(updated);
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
      if (!confirm("¿Eliminar este apartado?")) return;
      await api(`/api/layaways/${l.id}`, { method: "DELETE" });
      onDeleted();
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {l.customerName} · {l.folio}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-black dark:text-white">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Fecha {formatTicketDate(date)} · Hora {formatTicketTime(date)}
            </span>
            <Badge variant="outline">{l.status}</Badge>
          </div>
          {l.customerPhone && <p>Tel: {l.customerPhone}</p>}
          <div className="border-t border-dashed pt-2 space-y-1">
            {l.items.map((i) => (
              <div key={i.id} className="flex justify-between">
                <span>
                  {i.quantity} × {i.productName}
                </span>
                <span>{money(i.totalPrice)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 space-y-1 font-semibold">
            <div className="flex justify-between">
              <span>Total</span>
              <span>{money(l.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Dejó (anticipo)</span>
              <span>{money(l.deposit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pagado</span>
              <span>{money(l.paid)}</span>
            </div>
            <div className="flex justify-between">
              <span>Saldo</span>
              <span>{money(l.balance)}</span>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-1">Abonos</p>
            {l.payments.length === 0 ? (
              <p className="text-gray-500">Sin abonos.</p>
            ) : (
              l.payments.map((p) => {
                const d = new Date(p.createdAt);
                return (
                  <div key={p.id} className="flex justify-between">
                    <span>
                      {formatTicketDate(d)} {formatTicketTime(d)}
                    </span>
                    <span>{money(p.amount)}</span>
                  </div>
                );
              })
            )}
          </div>

          {l.status === "activo" && l.balance > 0 && (
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Monto del abono"
                className={inputClass}
              />
              <Button size="sm" disabled={!Number(amount)} onClick={addPayment}>
                Abonar
              </Button>
            </div>
          )}

          <PrintButton
            lines={layawayTicketLines(ticketData(l))}
            label="Reimprimir ticket"
          />

          <div className="flex flex-wrap gap-2 pt-1">
            {l.status === "activo" && (
              <>
                <Button size="sm" onClick={() => setStatus("entregado")}>
                  Marcar entregado
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus("cancelado")}
                >
                  Cancelar apartado
                </Button>
              </>
            )}
            {l.status !== "activo" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus("activo")}
              >
                Reactivar
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 ml-auto"
              onClick={remove}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewLayawayDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (l: LayawayDTO) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deposit, setDeposit] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Product[]>("/api/products")
      .then(setProducts)
      .catch(() => toast.error("No se pudieron cargar los productos"));
  }, []);

  const selectedItems = useMemo(
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
  const total = selectedItems.reduce((s, i) => s + i.subtotal, 0);
  const depositNumber = Number(deposit) || 0;

  const change = (id: string, delta: number) =>
    setQuantities((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + delta) }));

  const save = async () => {
    setSaving(true);
    try {
      const created = await api<LayawayDTO>("/api/layaways", {
        method: "POST",
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone || null,
          deposit: depositNumber,
          items: selectedItems.map((i) => ({
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

  const valid =
    name.trim() && selectedItems.length > 0 && depositNumber <= total;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo apartado</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-black dark:text-white">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de quien aparta"
            className={inputClass}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Teléfono (opcional)"
            className={inputClass}
          />
          <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 gap-2"
              >
                <div className="min-w-0">
                  <p className="truncate">{p.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {p.categoria} · {money(Number(p.precioMenudeo))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => change(p.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center">
                    {quantities[p.id] ?? 0}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => change(p.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            placeholder="Cantidad que deja (anticipo)"
            className={inputClass}
          />
          {depositNumber > total && (
            <p className="text-xs text-red-600">
              El anticipo no puede ser mayor al total.
            </p>
          )}
          <div className="flex justify-between font-semibold">
            <span>Saldo</span>
            <span>{money(Math.max(0, total - depositNumber))}</span>
          </div>
          <Button className="w-full" disabled={!valid || saving} onClick={save}>
            {saving ? "Guardando..." : "Guardar apartado"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
