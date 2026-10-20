"use client";

import { cn } from "@/lib/utils";
import { useRealtimeStatus } from "@/lib/realtime/client";

/** Punto "En vivo": verde si los cambios de otros equipos llegan solos, ámbar si no. */
export function LiveStatus({ className }: { className?: string }) {
  const status = useRealtimeStatus();
  const live = status === "live";
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-2 w-2 rounded-full",
          live ? "bg-emerald-500" : "animate-pulse bg-amber-500"
        )}
      />
      {live ? "En vivo" : "Reconectando…"}
    </span>
  );
}
