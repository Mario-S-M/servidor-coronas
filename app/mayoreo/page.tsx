"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Phone, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { SaleScreen } from "@/components/sales/sale-screen";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StoreMode, useProductStore } from "@/lib/store";
import { useRealtime } from "@/lib/realtime/client";
import { formatPhoneNumber } from "@/lib/utils";

interface Customer {
  id: string;
  nombre: string;
  telefono: string;
  createdAt: string;
}

function CustomerPicker() {
  const customerName = useProductStore((s) => s.customerName);
  const customerPhone = useProductStore((s) => s.customerPhone);
  const setCustomerName = useProductStore((s) => s.setCustomerName);
  const setCustomerPhone = useProductStore((s) => s.setCustomerPhone);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCustomers = useCallback(() => {
    fetch("/api/customers")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setCustomers)
      .catch(() => toast.error("Error al cargar los clientes"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);
  // Tiempo real: un cliente nuevo aparece en la lista sin recargar
  useRealtime(["customers"], loadCustomers);

  // Tras guardar una venta el cliente se limpia: se limpia también el selector
  useEffect(() => {
    if (!customerName) setSelectedId("");
  }, [customerName]);

  const select = (id: string) => {
    setSelectedId(id);
    const c = customers.find((x) => x.id === id);
    setCustomerName(c?.nombre ?? "");
    setCustomerPhone(c ? formatPhoneNumber(c.telefono) : "");
  };

  const newClient = (
    <Link
      href="/clientes"
      className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 text-sm font-semibold transition active:scale-[0.98] dark:border-zinc-700"
    >
      <UserPlus className="h-4 w-4" />
      Registrar cliente nuevo
    </Link>
  );

  return (
    <section className="space-y-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
        <User className="h-4 w-4" />
        Cliente mayorista <span className="text-red-600">*</span>
      </h2>
      {loading ? (
        <p className="text-sm text-zinc-500">Cargando clientes…</p>
      ) : customers.length === 0 ? (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Aún no hay clientes mayoristas registrados.
          </p>
          {newClient}
        </>
      ) : (
        <>
          <Select value={selectedId} onValueChange={select}>
            <SelectTrigger className="h-12 w-full text-base">
              <SelectValue placeholder="Elige un cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre} · {formatPhoneNumber(c.telefono)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedId && (
            <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Phone className="h-3.5 w-3.5" />
              {customerPhone}
            </p>
          )}
          {newClient}
        </>
      )}
    </section>
  );
}

export default function MayoreoPage() {
  return (
    <SaleScreen
      mode={StoreMode.MAYOREO}
      title="Ventas mayoreo"
      subtitle="Precios especiales para mayoristas"
      customerSection={<CustomerPicker />}
    />
  );
}
