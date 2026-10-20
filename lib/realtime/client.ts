"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

export type Topic = "sales" | "layaways" | "catalog" | "customers";
export type RealtimeStatus = "connecting" | "live" | "offline";

const ALL: Topic[] = ["sales", "layaways", "catalog", "customers"];

type Listener = () => void;
const listeners = new Map<Topic, Set<Listener>>(ALL.map((t) => [t, new Set()]));
const statusListeners = new Set<() => void>();

let source: EventSource | null = null;
let status: RealtimeStatus = "connecting";
let wasDown = false;
let wanted = false;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

// Los navegadores permiten ~6 conexiones abiertas por servidor (HTTP/1.1). Cada pestaña
// con una conexión fija ocuparía una; con varias pestañas abiertas, el menú y las
// pantallas se quedarían esperando. Por eso solo la mantiene la pestaña visible.
function disconnect() {
  source?.close();
  source = null;
  wasDown = true;
  setStatus("connecting");
}

function setStatus(next: RealtimeStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((fn) => fn());
}

function notify(topics: Topic[]) {
  const called = new Set<Listener>();
  for (const t of topics) {
    for (const fn of listeners.get(t) ?? []) {
      // Un mismo oyente suscrito a varios temas solo se llama una vez
      if (!called.has(fn)) {
        called.add(fn);
        fn();
      }
    }
  }
}

function connect() {
  wanted = true;
  if (source || typeof window === "undefined") return;
  source = new EventSource("/api/events");
  source.addEventListener("hello", () => {
    setStatus("live");
    // Tras una caída se vuelve a leer todo: pudo haber cambios que no llegaron
    if (wasDown) {
      wasDown = false;
      notify(ALL);
    }
  });
  for (const t of ALL) source.addEventListener(t, () => notify([t]));
  source.onerror = () => {
    wasDown = true;
    setStatus(source?.readyState === EventSource.CLOSED ? "offline" : "connecting");
    // Si el navegador desistió de reconectar, se reintenta a mano
    if (source?.readyState === EventSource.CLOSED) {
      source = null;
      setTimeout(connect, 3000);
    }
  };
}

if (typeof window !== "undefined") {
  // El teléfono suspende las conexiones con la pantalla apagada: al volver se resincroniza
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = null;
      if (!source) {
        // Al reconectar, "hello" vuelve a leer todo
        if (wanted) connect();
      } else {
        notify(ALL);
      }
    } else if (!hideTimer) {
      // Se espera un poco por si solo fue un cambio rápido de pestaña
      hideTimer = setTimeout(() => {
        hideTimer = null;
        if (document.visibilityState === "hidden") disconnect();
      }, 10_000);
    }
  });
  window.addEventListener("pagehide", () => source?.close());
  window.addEventListener("online", () => {
    if (!source && wanted) connect();
    notify(ALL);
  });
}

/**
 * Llama a `onChange` cuando cambia alguno de los temas (ventas, apartados, catálogo,
 * clientes). Agrupa avisos seguidos para no recargar varias veces.
 */
export function useRealtime(topics: Topic[], onChange: () => void) {
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  });
  const key = topics.join(",");

  useEffect(() => {
    connect();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const fire = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        callback.current();
      }, 300);
    };
    const mine = key.split(",") as Topic[];
    for (const t of mine) listeners.get(t)?.add(fire);
    return () => {
      for (const t of mine) listeners.get(t)?.delete(fire);
      if (timer) clearTimeout(timer);
    };
  }, [key]);
}

export function useRealtimeStatus(): RealtimeStatus {
  useEffect(() => {
    connect();
  }, []);
  return useSyncExternalStore(
    (cb) => {
      statusListeners.add(cb);
      return () => statusListeners.delete(cb);
    },
    () => status,
    () => "connecting" as RealtimeStatus
  );
}
