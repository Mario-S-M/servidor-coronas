"use client";

import { useState } from "react";
import { ChevronDown, Phone, User } from "lucide-react";
import { SaleScreen } from "@/components/sales/sale-screen";
import { StoreMode, useProductStore } from "@/lib/store";
import { formatPhoneNumber } from "@/lib/utils";

const field =
  "h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:ring-white";

function CustomerOptional() {
  const customerName = useProductStore((s) => s.customerName);
  const customerPhone = useProductStore((s) => s.customerPhone);
  const setCustomerName = useProductStore((s) => s.setCustomerName);
  const setCustomerPhone = useProductStore((s) => s.setCustomerPhone);
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left"
      >
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-black dark:text-white">
          <User className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {customerName ? customerName : "Cliente (opcional)"}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="grid gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nombre"
            aria-label="Nombre del cliente"
            className={field}
          />
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="tel"
              inputMode="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(formatPhoneNumber(e.target.value))}
              maxLength={14}
              placeholder="XX-XX-XX-XX-XX"
              aria-label="Teléfono del cliente"
              className={`${field} pl-10`}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default function VentasMenudeoPage() {
  return (
    <SaleScreen
      mode={StoreMode.MENUDEO}
      title="Ventas menudeo"
      subtitle="Precios al detalle"
      customerSection={<CustomerOptional />}
    />
  );
}
