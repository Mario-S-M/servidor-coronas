import { cn } from "@/lib/utils";
import type { LayawayDTO } from "@/lib/layaways";
import { KIND_LABEL, PRODUCTION_LABEL, STATUS_LABEL } from "@/lib/layaways";

export const money = (n: number) =>
  `$${n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/** Color de cada tipo de registro; el mismo se usa en el historial. */
export const KIND_STYLES = {
  apartado: {
    stripe: "bg-amber-500",
    chip: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  },
  pedido: {
    stripe: "bg-violet-500",
    chip: "bg-violet-100 text-violet-900 dark:bg-violet-500/20 dark:text-violet-200",
  },
  venta: {
    stripe: "bg-zinc-400",
    chip: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
  },
} as const;

const STATUS_STYLES: Record<LayawayDTO["status"], string> = {
  activo:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
  entregado: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
  cancelado: "bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-200",
};

export const PRODUCTION_STYLES: Record<LayawayDTO["production"], string> = {
  por_procesar:
    "bg-orange-100 text-orange-900 dark:bg-orange-500/20 dark:text-orange-200",
  procesando: "bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200",
  listo:
    "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black",
};

const chip =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function KindChip({
  kind,
  className,
}: {
  kind: keyof typeof KIND_STYLES;
  className?: string;
}) {
  const label =
    kind === "venta" ? "Venta" : KIND_LABEL[kind as "apartado" | "pedido"];
  return (
    <span className={cn(chip, KIND_STYLES[kind].chip, className)}>{label}</span>
  );
}

export function StatusChip({ status }: { status: LayawayDTO["status"] }) {
  return (
    <span className={cn(chip, STATUS_STYLES[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Etapa de elaboración de un pedido. */
export function ProductionChip({
  production,
}: {
  production: LayawayDTO["production"];
}) {
  return (
    <span className={cn(chip, PRODUCTION_STYLES[production])}>
      {PRODUCTION_LABEL[production]}
    </span>
  );
}

/** Barra de avance de lo pagado. */
export function PaidBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Porcentaje pagado"
    >
      <div
        className="h-full rounded-full bg-emerald-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export const inputClass =
  "h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-black dark:text-white dark:focus:ring-white";
