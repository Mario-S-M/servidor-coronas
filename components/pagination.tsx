"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const PAGE_SIZES = [15, 20, 50] as const;

/**
 * Divide una lista en páginas. `resetKey` cambia cuando cambian los filtros o la
 * búsqueda; en ese caso se vuelve a la página 1.
 */
export function usePagination<T>(items: T[], resetKey: string) {
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [state, setState] = useState({ page: 1, key: resetKey });

  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const requested = state.key === resetKey ? state.page : 1;
  const page = Math.min(requested, pages);

  const goTo = (next: number) => {
    setState({ page: Math.min(Math.max(1, next), pages), key: resetKey });
    // El scroll vive en <main>, no en la ventana
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    pageItems: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pages,
    pageSize,
    total: items.length,
    goTo,
    setPageSize: (size: number) => {
      setPageSize(size);
      setState({ page: 1, key: resetKey });
    },
  };
}

type PaginationState = Pick<
  ReturnType<typeof usePagination>,
  "page" | "pages" | "pageSize" | "total" | "goTo" | "setPageSize"
>;

const navBtn =
  "flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-semibold transition active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:bg-black";

/** Números de página con huecos: 1 … 4 5 6 … 12 */
function visiblePages(page: number, pages: number): (number | "gap")[] {
  const set = new Set([1, pages, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

export function Pagination({
  page,
  pages,
  pageSize,
  total,
  goTo,
  setPageSize,
  className,
}: PaginationState & { className?: string }) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Paginación"
      className={cn("mt-5 space-y-3 text-black dark:text-white", className)}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-zinc-600 dark:text-zinc-400">
          Mostrando <span className="font-semibold tabular-nums">{from}–{to}</span>{" "}
          de <span className="font-semibold tabular-nums">{total}</span>
        </p>
        <label className="flex items-center gap-2">
          <span className="text-zinc-600 dark:text-zinc-400">Por página</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-semibold tabular-nums dark:border-zinc-700 dark:bg-black"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className={navBtn}
            disabled={page === 1}
            onClick={() => goTo(page - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden min-[420px]:inline">Anterior</span>
          </button>

          {/* En pantallas muy angostas basta con "Página X de Y" */}
          <p className="text-sm font-semibold tabular-nums sm:hidden">
            Página {page} de {pages}
          </p>
          <ul className="hidden items-center gap-1 sm:flex">
            {visiblePages(page, pages).map((n, i) =>
              n === "gap" ? (
                <li key={`gap-${i}`} aria-hidden className="px-1 text-zinc-400">
                  …
                </li>
              ) : (
                <li key={n}>
                  <button
                    type="button"
                    onClick={() => goTo(n)}
                    aria-current={n === page ? "page" : undefined}
                    aria-label={`Página ${n}`}
                    className={cn(
                      navBtn,
                      "tabular-nums",
                      n === page &&
                        "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    )}
                  >
                    {n}
                  </button>
                </li>
              )
            )}
          </ul>

          <button
            type="button"
            className={navBtn}
            disabled={page === pages}
            onClick={() => goTo(page + 1)}
            aria-label="Página siguiente"
          >
            <span className="hidden min-[420px]:inline">Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  );
}
