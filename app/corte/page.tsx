"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calculator, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SaleItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Sale {
  id: string;
  ticketNumber: string;
  type: string;
  total: number;
  totalItems: number;
  createdAt: string;
  items?: SaleItem[];
}

export default function CorteCajaPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    filterSalesByDate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, allSales]);

  const loadSales = async () => {
    try {
      const response = await fetch("/api/sales");
      if (response.ok) {
        const data = await response.json();
        const salesWithNumbers = data.map((sale: Sale) => ({
          ...sale,
          total:
            typeof sale.total === "number" ? sale.total : Number(sale.total),
          items: sale.items?.map((item: SaleItem) => ({
            ...item,
            unitPrice:
              typeof item.unitPrice === "number"
                ? item.unitPrice
                : Number(item.unitPrice),
            totalPrice:
              typeof item.totalPrice === "number"
                ? item.totalPrice
                : Number(item.totalPrice),
          })),
        }));
        setAllSales(salesWithNumbers);
      }
    } catch (error) {
      console.error("Error al cargar ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSalesByDate = () => {
    const filtered = allSales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      return (
        saleDate.getDate() === date.getDate() &&
        saleDate.getMonth() === date.getMonth() &&
        saleDate.getFullYear() === date.getFullYear()
      );
    });
    setFilteredSales(filtered);
  };

  const getTotalMenudeo = () => {
    return filteredSales
      .filter((sale) => sale.type === "menudeo")
      .reduce((sum, sale) => sum + sale.total, 0);
  };

  const getTotalMayoreo = () => {
    return filteredSales
      .filter((sale) => sale.type === "mayoreo")
      .reduce((sum, sale) => sum + sale.total, 0);
  };

  const getTotalGeneral = () => {
    return filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  };

  const getVentasMenudeo = () => {
    return filteredSales.filter((sale) => sale.type === "menudeo").length;
  };

  const getVentasMayoreo = () => {
    return filteredSales.filter((sale) => sale.type === "mayoreo").length;
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Calculator className="h-8 w-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Corte de Caja
              </h1>
              <p className="text-gray-600">Resumen de ventas por día</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selector de fecha */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Fecha</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? (
                        format(date, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="mt-6 space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ventas Menudeo:</span>
                          <span className="font-semibold">
                            {getVentasMenudeo()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Menudeo:</span>
                          <span className="font-semibold">
                            ${getTotalMenudeo().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ventas Mayoreo:</span>
                          <span className="font-semibold">
                            {getVentasMayoreo()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Mayoreo:</span>
                          <span className="font-semibold">
                            ${getTotalMayoreo().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">
                            Total General:
                          </span>
                          <span className="font-bold text-lg">
                            ${getTotalGeneral().toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Ventas:</span>
                          <span className="font-semibold">
                            {filteredSales.length}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de ventas del día */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Ventas del{" "}
                  {format(date, "d 'de' MMMM 'de' yyyy", { locale: es })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredSales.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No hay ventas para este día</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSales.map((sale) => (
                      <Card key={sale.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">
                                  {sale.ticketNumber}
                                </span>
                                <Badge
                                  variant={
                                    sale.type === "menudeo"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {sale.type.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {sale.totalItems} artículo
                                {sale.totalItems !== 1 ? "s" : ""}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(sale.createdAt).toLocaleTimeString(
                                  "es-MX",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">
                                ${sale.total.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
