"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, User, Phone } from "lucide-react";
import { useProductStore } from "@/lib/store";

export function Ticket() {
  const {
    getTicketItems,
    getTotalAmount,
    resetAllProducts,
    getTotalItems,
    customerName,
    customerPhone,
  } = useProductStore();
  const items = getTicketItems();
  const now = new Date();
  const fecha = now.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const hora = now.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const itemsWithQuantity = items.filter((item) => item.cantidad > 0);
  const totalGeneral = getTotalAmount();
  const totalItems = getTotalItems();
  const ticketNumber = `#${String(Date.now()).slice(-6)}`;

  if (itemsWithQuantity.length === 0) {
    return (
      <Card className="w-full shadow-lg border-2 border-black dark:border-white bg-white dark:bg-black">
        <CardHeader className="text-center border-b bg-black dark:bg-white text-white dark:text-black p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-bold">
            TICKET DE VENTA
          </CardTitle>
          <p className="text-xs sm:text-sm font-medium">Coronas PEKKA</p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center py-6 sm:py-8">
            <p className="text-black dark:text-white text-sm sm:text-base mb-2 font-semibold">
              Ticket vacío
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
              Seleccione productos para generar su factura
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-2 border-black dark:border-white bg-white dark:bg-black">
      {/* Header formal */}
      <CardHeader className="text-center border-b bg-black dark:bg-white text-white dark:text-black pb-3 sm:pb-4 p-3 sm:p-6">
        <CardTitle className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
          TICKET DE VENTA
        </CardTitle>
        <div className="text-xs sm:text-sm">
          <p className="font-semibold text-sm sm:text-base">Coronas PEKKA</p>
          <p className="text-xs mt-1 text-gray-300 dark:text-gray-700">
            Artículos Funerarios
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        {/* Información del ticket */}
        <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-dashed border-black dark:border-white">
          <div className="flex justify-between text-xs text-black dark:text-white mb-1">
            <span className="font-semibold">Ticket:</span>
            <span className="font-mono font-bold">{ticketNumber}</span>
          </div>
          <div className="flex justify-between text-xs text-black dark:text-white mb-1">
            <span className="font-semibold">Fecha:</span>
            <span className="font-medium text-right ml-2">{fecha}</span>
          </div>
          <div className="flex justify-between text-xs text-black dark:text-white">
            <span className="font-semibold">Hora:</span>
            <span className="font-mono font-medium">{hora}</span>
          </div>
        </div>

        {/* Información del cliente (si existe) */}
        {(customerName || customerPhone) && (
          <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-dashed border-black dark:border-white">
            <h3 className="text-xs sm:text-sm font-bold text-black dark:text-white mb-2">
              Información del Cliente
            </h3>
            {customerName && (
              <div className="flex items-center gap-2 text-xs text-black dark:text-white mb-1">
                <User className="h-3 w-3" />
                <span className="font-semibold">Nombre:</span>
                <span className="font-medium break-all">{customerName}</span>
              </div>
            )}
            {customerPhone && (
              <div className="flex items-center gap-2 text-xs text-black dark:text-white">
                <Phone className="h-3 w-3" />
                <span className="font-semibold">Teléfono:</span>
                <span className="font-medium">{customerPhone}</span>
              </div>
            )}
          </div>
        )}

        {/* Desglose de productos */}
        <div className="mb-3 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-bold text-black dark:text-white mb-2 sm:mb-3 text-center uppercase tracking-wide border-b border-black dark:border-white pb-1">
            Detalle de la Compra
          </h3>

          <div className="space-y-2 sm:space-y-3 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto pr-1">
            {itemsWithQuantity.map((item, index) => (
              <div
                key={index}
                className="border-b border-black dark:border-white border-dashed pb-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs sm:text-sm font-bold text-black dark:text-white leading-tight break-words">
                      {item.nombre}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-black dark:text-white font-medium">
                        {item.cantidad} × ${item.precio.toFixed(2)}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-black dark:text-white">
                        ${item.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div className="border-t-2 border-black dark:border-white pt-2 sm:pt-3 mb-3 sm:mb-4">
          <div className="flex justify-between text-xs sm:text-sm text-black dark:text-white mb-2">
            <span className="font-semibold">Cantidad de artículos:</span>
            <span className="font-bold">{totalItems}</span>
          </div>
          <div className="flex justify-between text-sm sm:text-lg font-bold text-black dark:text-white bg-gray-100 dark:bg-gray-900 p-2 rounded">
            <span className="text-xs sm:text-base">TOTAL A PAGAR:</span>
            <span className="text-sm sm:text-lg">
              ${totalGeneral.toFixed(2)} MXN
            </span>
          </div>
        </div>

        {/* Pie del ticket */}
        <div className="text-center text-xs text-black dark:text-white mb-3 sm:mb-4 border-t border-dashed border-black dark:border-white pt-2 sm:pt-3">
          <p className="font-semibold">Gracias por su preferencia</p>
          <p className="mt-1 font-medium">¡Que tenga un buen día!</p>
        </div>

        {/* Botones */}
        <div className="space-y-2">
          <Button
            size="sm"
            onClick={async () => {
              const { saveSale } = useProductStore.getState();
              await saveSale();
              resetAllProducts();
            }}
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white text-sm sm:text-base py-2 sm:py-3"
          >
            💾 Guardar Venta
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAllProducts}
            className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 text-sm sm:text-base py-2 sm:py-3"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
