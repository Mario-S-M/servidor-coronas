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
      <Card className="w-full lg:max-w-sm shadow-lg border-2 border-black">
        <CardHeader className="text-center border-b bg-black text-white">
          <CardTitle className="text-lg font-bold">TICKET DE VENTA</CardTitle>
          <p className="text-sm font-medium">Coronas PEKKA</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-black text-base mb-2 font-semibold">
              Ticket vacío
            </p>
            <p className="text-sm text-gray-600 font-medium">
              Seleccione productos para generar su factura
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full lg:max-w-sm shadow-lg border-2 border-black">
      {/* Header formal */}
      <CardHeader className="text-center border-b bg-black text-white pb-4">
        <CardTitle className="text-xl font-bold mb-2">
          TICKET DE VENTA
        </CardTitle>
        <div className="text-sm">
          <p className="font-semibold text-base">Coronas PEKKA</p>
          <p className="text-xs mt-1 text-gray-300">Artículos Funerarios</p>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Información del ticket */}
        <div className="mb-4 pb-3 border-b border-dashed border-black">
          <div className="flex justify-between text-xs text-black mb-1">
            <span className="font-semibold">Ticket:</span>
            <span className="font-mono font-bold">{ticketNumber}</span>
          </div>
          <div className="flex justify-between text-xs text-black mb-1">
            <span className="font-semibold">Fecha:</span>
            <span className="font-medium">{fecha}</span>
          </div>
          <div className="flex justify-between text-xs text-black">
            <span className="font-semibold">Hora:</span>
            <span className="font-mono font-medium">{hora}</span>
          </div>
        </div>

        {/* Información del cliente (si existe) */}
        {(customerName || customerPhone) && (
          <div className="mb-4 pb-3 border-b border-dashed border-black">
            <h3 className="text-sm font-bold text-black mb-2">
              Información del Cliente
            </h3>
            {customerName && (
              <div className="flex items-center gap-2 text-xs text-black mb-1">
                <User className="h-3 w-3" />
                <span className="font-semibold">Nombre:</span>
                <span className="font-medium">{customerName}</span>
              </div>
            )}
            {customerPhone && (
              <div className="flex items-center gap-2 text-xs text-black">
                <Phone className="h-3 w-3" />
                <span className="font-semibold">Teléfono:</span>
                <span className="font-medium">{customerPhone}</span>
              </div>
            )}
          </div>
        )}

        {/* Desglose de productos */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-black mb-3 text-center uppercase tracking-wide border-b border-black pb-1">
            Detalle de la Compra
          </h3>

          <div className="space-y-3">
            {itemsWithQuantity.map((item, index) => (
              <div
                key={index}
                className="border-b border-black border-dashed pb-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-bold text-black leading-tight">
                      {item.nombre}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-black font-medium">
                        {item.cantidad} × ${item.precio.toFixed(2)}
                      </p>
                      <p className="text-sm font-bold text-black">
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
        <div className="border-t-2 border-black pt-3 mb-4">
          <div className="flex justify-between text-sm text-black mb-2">
            <span className="font-semibold">Cantidad de artículos:</span>
            <span className="font-bold">{totalItems}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-black bg-gray-100 p-2 rounded">
            <span>TOTAL A PAGAR:</span>
            <span>${totalGeneral.toFixed(2)} MXN</span>
          </div>
        </div>

        {/* Pie del ticket */}
        <div className="text-center text-xs text-black mb-4 border-t border-dashed border-black pt-3">
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
            className="w-full bg-green-600 hover:bg-green-700"
          >
            💾 Guardar Venta
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAllProducts}
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
