import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LayawayDTO } from "@/lib/layaways";
import {
  KIND_STYLES,
  KindChip,
  PaidBar,
  ProductionChip,
  StatusChip,
  formatDate,
  formatTime,
  money,
} from "./ui";

export function LayawayCard({
  layaway: l,
  onOpen,
}: {
  layaway: LayawayDTO;
  onOpen: () => void;
}) {
  // "Ramo de flores ×2" cuando hay varios del mismo extra
  const counts = new Map<string, number>();
  for (const a of l.items.flatMap((i) => i.addons)) {
    counts.set(a.name, (counts.get(a.name) ?? 0) + 1);
  }
  const addonNames = [...counts].map(([name, n]) => (n > 1 ? `${name} ×${n}` : name));
  const itemCount = l.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 pl-5 text-left shadow-sm transition active:scale-[0.99] hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          KIND_STYLES[l.kind].stripe
        )}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <KindChip kind={l.kind} />
            <StatusChip status={l.status} />
            {l.kind === "pedido" && l.status === "activo" && (
              <ProductionChip production={l.production} />
            )}
          </div>
          <p className="truncate text-lg font-bold leading-tight text-black dark:text-white">
            {l.customerName}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {l.folio} · {formatDate(l.createdAt)} · {formatTime(l.createdAt)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Saldo
          </p>
          <p className="text-xl font-bold tabular-nums text-black dark:text-white">
            {money(l.balance)}
          </p>
        </div>
      </div>

      {addonNames.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {addonNames.map((name) => (
            <span
              key={name}
              className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        <PaidBar paid={l.paid} total={l.total} />
        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <span>
            Dejó {money(l.deposit)} · Total {money(l.total)}
          </span>
          <span className="flex items-center gap-0.5 font-medium text-black dark:text-white">
            {itemCount} {l.kind === "pedido" ? "corona" : "artículo"}
            {itemCount === 1 ? "" : "s"}
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
