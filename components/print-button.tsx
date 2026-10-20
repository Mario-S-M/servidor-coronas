"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
    <div className={className}>
      <Button
        size="sm"
        disabled={!lines || busy || !supported}
        onClick={() => printBluetooth(false)}
        className="w-full"
      >
        <Printer className="h-4 w-4 mr-2" />
        {busy ? "Imprimiendo..." : label}
      </Button>
      {!supported && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 text-center">
          Bluetooth no disponible: usa Chrome en Android y abre la app por
          HTTPS (o habilita la bandera de origen seguro).
        </p>
      )}
      <div className="mt-1 flex justify-center gap-3 text-xs">
        {supported && (
          <button
            type="button"
            disabled={!lines || busy}
            onClick={() => printBluetooth(true)}
            className="underline text-gray-600 dark:text-gray-400 disabled:opacity-50"
          >
            {printerName ? `Cambiar impresora (${printerName})` : "Elegir impresora"}
          </button>
        )}
        <button
          type="button"
          disabled={!lines}
          onClick={printFallback}
          className="underline text-gray-600 dark:text-gray-400 disabled:opacity-50"
        >
          Imprimir con el navegador
        </button>
      </div>
    </div>
  );
}
