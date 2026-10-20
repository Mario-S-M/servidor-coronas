"use client";

import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { inputClass, money } from "./ui";

/** Pantalla de captura: completa en teléfono, tarjeta centrada en escritorio. */
export function FormShell({
  title,
  subtitle,
  onClose,
  children,
  total,
  deposit,
  onDepositChange,
  canSave,
  saving,
  onSave,
  saveLabel,
  hint,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
  total: number;
  deposit: string;
  onDepositChange: (v: string) => void;
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
  saveLabel: string;
  hint?: string | null;
}) {
  const depositNumber = Number(deposit) || 0;
  const balance = Math.max(0, total - depositNumber);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[100dvh] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 rounded-none p-0 sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-2xl">
        <div className="border-b border-zinc-200 px-4 py-3 pr-12 dark:border-zinc-800">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>

        <div className="space-y-5 overflow-y-auto px-4 py-4 text-sm text-black dark:text-white">
          {children}
        </div>

        <div className="space-y-3 border-t border-zinc-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 dark:border-zinc-800 dark:bg-black">
          <div className="grid grid-cols-[1fr_auto_auto] items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Cantidad que deja
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={deposit}
                onChange={(e) => onDepositChange(e.target.value)}
                placeholder="$0.00"
                className={inputClass}
              />
            </label>
            <Figure label="Total" value={money(total)} />
            <Figure label="Saldo" value={money(balance)} strong />
          </div>
          {hint && <p className="text-xs text-red-600">{hint}</p>}
          <button
            type="button"
            disabled={!canSave || saving}
            onClick={onSave}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Guardando..." : saveLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Figure({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="pb-1 text-right">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={`tabular-nums ${
          strong ? "text-lg font-bold" : "text-base font-semibold"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}
