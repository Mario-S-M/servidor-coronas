"use client";

import { useEffect, useState } from "react";
import { ProductCounter } from "@/components/ui/product-counter";
import { ProductSection } from "@/components/ui/product-section";
import { Accordion } from "@/components/ui/accordion";
import { Ticket } from "@/components/ui/ticket";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Phone, UserPlus } from "lucide-react";
import { useProductStore, StoreMode } from "@/lib/store";
import { formatPhoneNumber } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface Customer {
  id: string;
  nombre: string;
  telefono: string;
  createdAt: string;
}

export default function MayoreoPage() {
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

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMode(StoreMode.MAYOREO);
    loadProductsFromDB();
    loadCustomers();
  }, [setMode, loadProductsFromDB]);

  const loadCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        toast.error("Error al cargar los clientes");
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      toast.error("Error al cargar los clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setCustomerName(customer.nombre);
      setCustomerPhone(formatPhoneNumber(customer.telefono));
    } else {
      setCustomerName("");
      setCustomerPhone("");
    }
  };

  const categories = getCategories();

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 bg-white dark:bg-black">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white">
              Ventas Mayoreo
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Precios especiales para mayoristas
            </p>
          </div>
          <Badge
            variant="secondary"
            className="text-xs sm:text-sm w-fit bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
          >
            Modo: {mode === StoreMode.MAYOREO ? "Mayoreo" : "Menudeo"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 max-w-7xl mx-auto">
        <div className="flex-1 lg:max-w-2xl space-y-3 sm:space-y-4">
          <Card className="border-black dark:border-white bg-white dark:bg-black">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg text-black dark:text-white">
                Seleccionar Cliente Mayorista *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {loading ? (
                <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                  Cargando clientes...
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No hay clientes mayoristas registrados
                  </p>
                  <Link href="/clientes">
                    <Button
                      size="sm"
                      className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Registrar Nuevo Cliente
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs sm:text-sm font-semibold flex items-center gap-2 mb-1.5 sm:mb-2 text-black dark:text-white">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Cliente *
                    </label>
                    <Select
                      value={selectedCustomerId}
                      onValueChange={handleCustomerSelect}
                      required
                    >
                      <SelectTrigger className="w-full text-sm sm:text-base">
                        <SelectValue placeholder="-- Seleccione un cliente --" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.nombre} -{" "}
                            {formatPhoneNumber(customer.telefono)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCustomerId && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                      <h3 className="text-xs sm:text-sm font-semibold text-black dark:text-white mb-2">
                        Información del Cliente
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          <User className="h-3 w-3" />
                          <span className="font-medium">{customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          <Phone className="h-3 w-3" />
                          <span className="font-medium">{customerPhone}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                    <Link href="/clientes">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs sm:text-sm border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900"
                      >
                        <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                        Registrar Nuevo Cliente
                      </Button>
                    </Link>
                  </div>
                </>
              )}
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

        <div className="lg:w-80 lg:sticky lg:top-4 lg:self-start">
          <Ticket />
        </div>
      </div>
    </div>
  );
}
