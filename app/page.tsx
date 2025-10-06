"use client";

import { useEffect } from "react";
import { ProductCounter } from "@/components/ui/product-counter";
import { ProductSection } from "@/components/ui/product-section";
import { Accordion } from "@/components/ui/accordion";
import { Ticket } from "@/components/ui/ticket";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone } from "lucide-react";
import { useProductStore, StoreMode } from "@/lib/store";
import { formatPhoneNumber } from "@/lib/utils";

export default function DashboardPage() {
  const {
    loadProductsFromDB,
    setMode,
    mode,
    customerName,
    customerPhone,
    setCustomerName,
    setCustomerPhone,
    getCategories,
    getProductsByCategory,
  } = useProductStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        setMode(StoreMode.MENUDEO);
        await loadProductsFromDB();
      } catch (error) {
        console.error("Error inicializando la aplicación:", error);
      }
    };

    initApp();
  }, [setMode, loadProductsFromDB]);

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setCustomerPhone(formatted);
  };

  const categories = getCategories();

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventas Menudeo</h1>
            <p className="text-gray-600">Precios al detalle</p>
          </div>
          <Badge variant="default" className="text-sm">
            Modo: {mode === StoreMode.MENUDEO ? "Menudeo" : "Mayoreo"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 max-w-7xl mx-auto">
        <div className="flex-1 lg:max-w-2xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Información del Cliente (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  placeholder="Ingrese el nombre del cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4" />
                  Teléfono del Cliente
                </label>
                <input
                  type="tel"
                  placeholder="XX-XX-XX-XX-XX"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  maxLength={14}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato: XX-XX-XX-XX-XX (10 dígitos)
                </p>
              </div>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full">
            {categories.map((categoria) => {
              const productos = getProductsByCategory(categoria);
              if (productos.length === 0) return null;

              return (
                <ProductSection
                  key={categoria}
                  value={categoria}
                  title={categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                >
                  {productos.map((producto) => (
                    <ProductCounter
                      key={producto.id}
                      productId={producto.id}
                      nombre={producto.nombre}
                    />
                  ))}
                </ProductSection>
              );
            })}
          </Accordion>
        </div>

        <div className="lg:w-80 lg:sticky lg:top-4 lg:h-fit">
          <div className="lg:block">
            <Ticket />
          </div>
        </div>
      </div>
    </div>
  );
}
