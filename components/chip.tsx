import { cn } from "@/lib/utils";

/** Filtro en forma de píldora. Se acomodan en renglones (flex-wrap): sin scroll horizontal. */
export function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  /** Insignia con una cantidad (ej. artículos de esa categoría en el ticket). */
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition active:scale-95",
        active
          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-black dark:text-zinc-200"
      )}
    >
      {children}
      {!!count && count > 0 && (
        <span
          className={cn(
            "min-w-5 rounded-full px-1.5 text-center text-xs font-bold tabular-nums",
            active
              ? "bg-white text-black dark:bg-black dark:text-white"
              : "bg-black text-white dark:bg-white dark:text-black"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function ChipRow({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {children}
    </div>
  );
}
