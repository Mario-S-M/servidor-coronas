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

export default function MayoreoPage() {
  const {
    loadProductsFromDB,
    setMode,
    mode,
    customerName,
    customerPhone,
    setCustomerName,
    setCustomerPhone,
  } = useProductStore();

  useEffect(() => {
    setMode(StoreMode.MAYOREO);
    loadProductsFromDB();
  }, [setMode, loadProductsFromDB]);

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setCustomerPhone(formatted);
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventas Mayoreo</h1>
            <p className="text-gray-600">Precios especiales para mayoristas</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Modo: {mode === StoreMode.MAYOREO ? "Mayoreo" : "Menudeo"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 max-w-7xl mx-auto">
        <div className="flex-1 lg:max-w-2xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Información del Cliente *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  placeholder="Ingrese el nombre del cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4" />
                  Teléfono del Cliente *
                </label>
                <input
                  type="tel"
                  placeholder="XX-XX-XX-XX-XX"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  required
                  maxLength={14}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato: XX-XX-XX-XX-XX (10 dígitos)
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                * Campos obligatorios para ventas de mayoreo
              </p>
            </CardContent>
          </Card>

          <Accordion type="single" collapsible className="w-full">
            <ProductSection value="coronas" title="Coronas">
              <ProductCounter productId="corona-ramo" nombre="Corona de Ramo" />
              <ProductCounter
                productId="corona-grande"
                nombre="Corona grande con imagen"
              />
              <ProductCounter
                productId="corona-mediana"
                nombre="Corona mediana con imagen"
              />
              <ProductCounter
                productId="corona-pequeña"
                nombre="Corona pequeña con imagen"
              />
            </ProductSection>

            <ProductSection value="cruces" title="Cruces">
              <ProductCounter productId="cruz-grande" nombre="Cruz grande" />
              <ProductCounter productId="cruz-mediana" nombre="Cruz mediana" />
              <ProductCounter productId="cruz-pequeña" nombre="Cruz pequeña" />
            </ProductSection>

            <ProductSection value="arcos" title="Arcos">
              <ProductCounter productId="arco-grande" nombre="Arco grande" />
              <ProductCounter productId="arco-mediano" nombre="Arco mediano" />
              <ProductCounter productId="arco-pequeño" nombre="Arco pequeño" />
            </ProductSection>
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
