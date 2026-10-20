import { subscribe } from "@/lib/realtime/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Flujo de eventos (SSE): cada pestaña abierta recibe qué tema cambió. */
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      send("retry: 2000\n\n");
      send("event: hello\ndata: ok\n\n");

      const unsubscribe = subscribe((topic) => send(`event: ${topic}\ndata: 1\n\n`));
      // Latido: evita que celulares, redes o proxies cierren la conexión por inactividad
      const heartbeat = setInterval(() => send(": ping\n\n"), 20_000);

      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // ya estaba cerrado
        }
      };
      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
