"use client";

import { useEffect, useState } from "react";
import { Bluetooth, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getSavedPrinterName,
  isBluetoothSupported,
  printBytes,
} from "@/lib/printing/bluetooth-printer";
import { printWithBrowser } from "@/lib/printing/browser-print";
import { linesToEscPos, type TicketLine } from "@/lib/printing/tickets";

interface PrintButtonProps {
  /** Líneas del ticket a imprimir. */
  lines: TicketLine[] | null;
  label?: string;
  className?: string;
}

const base =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white";

export function PrintButton({
  lines,
  label = "Imprimir ticket",
  className,
}: PrintButtonProps) {
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);
  const [printerName, setPrinterName] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isBluetoothSupported());
    setPrinterName(getSavedPrinterName());
  }, []);

  const printBluetooth = async (chooseNew: boolean) => {
    if (!lines) return;
    setBusy(true);
    try {
      const name = await printBytes(linesToEscPos(lines), { chooseNew });
      setPrinterName(name);
      toast.success(`Ticket enviado a ${name}`);
    } catch (error) {
      // Cancelar el selector de dispositivos no es un error
      if (error instanceof DOMException && error.name === "NotFoundError") return;
      toast.error("No se pudo imprimir", {
        description:
          error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setBusy(false);
    }
  };

  const printFallback = () => {
    if (!lines) return;
    try {
      printWithBrowser(lines);
    } catch (error) {
      toast.error("No se pudo imprimir", {
        description:
          error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        disabled={!lines || busy || !supported}
        onClick={() => printBluetooth(false)}
        className={cn(
          base,
          "h-12 bg-black text-base text-white dark:bg-white dark:text-black"
        )}
      >
        <Printer className="h-5 w-5" />
        {busy ? "Imprimiendo..." : label}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!lines || busy || !supported}
          onClick={() => printBluetooth(true)}
          className={cn(
            base,
            "h-11 border border-zinc-300 bg-white text-sm text-black dark:border-zinc-700 dark:bg-black dark:text-white"
          )}
        >
          <Bluetooth className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {printerName ? "Cambiar impresora" : "Elegir impresora"}
          </span>
        </button>
        <button
          type="button"
          disabled={!lines}
          onClick={printFallback}
          className={cn(
            base,
            "h-11 border border-zinc-300 bg-white text-sm text-black dark:border-zinc-700 dark:bg-black dark:text-white"
          )}
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate">Con el navegador</span>
        </button>
      </div>

      {supported ? (
        printerName && (
          <p className="truncate text-center text-xs text-zinc-500 dark:text-zinc-400">
            Impresora: {printerName}
          </p>
        )
      ) : (
        <p className="text-center text-xs text-amber-700 dark:text-amber-400">
          Bluetooth no disponible. Usa Chrome en Android con HTTPS, o imprime
          con el navegador.
        </p>
      )}
    </div>
  );
}
