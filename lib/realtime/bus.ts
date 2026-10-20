// Bus de eventos en memoria (servidor). Funciona porque la app corre en un solo proceso
// (PM2 con instances: 1). Si algún día hay varias instancias, este módulo se cambia por
// LISTEN/NOTIFY de Postgres sin tocar las pantallas.

export type Topic = "sales" | "layaways" | "catalog" | "customers";

type Listener = (topic: Topic) => void;

const globalForBus = globalThis as unknown as { __realtimeListeners?: Set<Listener> };
const listeners = (globalForBus.__realtimeListeners ??= new Set<Listener>());

/** Avisa a todos los equipos conectados que cambió algo de ese tema. */
export function publish(...topics: Topic[]) {
  for (const topic of new Set(topics)) {
    for (const fn of listeners) {
      try {
        fn(topic);
      } catch {
        // un cliente caído no debe afectar a los demás
      }
    }
  }
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Envuelve un manejador de escritura de la API: si responde bien (2xx), avisa a todos los
 * equipos conectados que cambió ese tema.
 */
export function withRealtime<A extends unknown[]>(
  topics: Topic[],
  handler: (...args: A) => Promise<Response>
) {
  return async (...args: A) => {
    const response = await handler(...args);
    if (response.ok) publish(...topics);
    return response;
  };
}
