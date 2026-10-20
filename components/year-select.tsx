"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const THIS_YEAR = new Date().getFullYear();

/** Años con datos (precios, ventas o apartados), del más nuevo al más viejo. */
export function useYears() {
  const [years, setYears] = useState<number[]>([THIS_YEAR]);
  useEffect(() => {
    fetch(`/api/prices?year=${THIS_YEAR}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { years: number[] } | null) => {
        // El año siguiente solo sirve para capturar precios, no para consultar registros
        if (d) setYears(d.years.filter((y) => y <= THIS_YEAR));
      })
      .catch(() => {});
  }, []);
  return years;
}

export function YearSelect({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (year: number) => void;
  className?: string;
}) {
  const years = useYears();
  return (
    <label className={cn("inline-flex items-center gap-2", className)}>
      <span className="hidden text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:inline dark:text-zinc-400">
        Año
      </span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10 rounded-full border border-zinc-300 bg-white px-4 text-sm font-bold tabular-nums dark:border-zinc-700 dark:bg-black"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}
