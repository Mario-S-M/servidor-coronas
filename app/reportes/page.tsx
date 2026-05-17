"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Package, TrendingUp, Tag } from "lucide-react";

interface ProductoStats {
  nombre: string;
  cantidad: number;
  ingresos: number;
}

interface CategoriaStats {
  categoria: string;
  totalCantidad: number;
  totalIngresos: number;
  productos: ProductoStats[];
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2024 }, (_, i) => 2025 + i);

export default function ReportesPage() {
  const [data, setData] = useState<CategoriaStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [anio, setAnio] = useState(CURRENT_YEAR);
  const [tipo, setTipo] = useState("all");

  const fetchData = async (selectedAnio = anio, selectedTipo = tipo) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("desde", `${selectedAnio}-01-01`);
      params.set("hasta", `${selectedAnio}-12-31`);
      if (selectedTipo !== "all") params.set("tipo", selectedTipo);

      const res = await fetch(`/api/reportes?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error al cargar reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPiezas = data.reduce((s, c) => s + c.totalCantidad, 0);
  const totalIngresos = data.reduce((s, c) => s + c.totalIngresos, 0);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Reporte de Ventas
        </h1>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div>
                <label className="text-sm font-medium mb-1 block">Año</label>
                <div className="flex gap-2">
                  {YEARS.map((y) => (
                    <Button
                      key={y}
                      size="sm"
                      variant={anio === y ? "default" : "outline"}
                      onClick={() => setAnio(y)}
                      className="w-20"
                    >
                      {y}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tipo</label>
                <div className="flex gap-2">
                  {(["all", "menudeo", "mayoreo"] as const).map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={tipo === t ? "default" : "outline"}
                      onClick={() => setTipo(t)}
                      className="text-xs"
                    >
                      {t === "all" ? "Todos" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={() => fetchData(anio, tipo)}>
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tarjetas de resumen */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold">{totalPiezas}</p>
                <p className="text-xs text-muted-foreground">Piezas vendidas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <Tag className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold">{data.length}</p>
                <p className="text-xs text-muted-foreground">Categorías</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-2xl font-bold">${totalIngresos.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Ingresos</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Acordeón */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando...
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No hay ventas en el período seleccionado
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {data.map((cat) => (
              <AccordionItem
                key={cat.categoria}
                value={cat.categoria}
                className="border border-gray-200 dark:border-gray-800 rounded-lg px-4 bg-white dark:bg-black"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="font-semibold text-left">
                      {cat.categoria}
                    </span>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-mono">
                        {cat.totalCantidad} pzas
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">
                        ${cat.totalIngresos.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    {cat.productos.map((prod, i) => {
                      const pct = Math.round(
                        (prod.cantidad / cat.totalCantidad) * 100
                      );
                      return (
                        <div key={prod.nombre} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-5 text-right text-xs">
                                {i + 1}.
                              </span>
                              <span className="font-medium">{prod.nombre}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground text-xs">
                                ${prod.ingresos.toFixed(2)}
                              </span>
                              <Badge
                                variant="outline"
                                className="font-mono text-xs w-20 justify-center"
                              >
                                {prod.cantidad} pzas
                              </Badge>
                            </div>
                          </div>
                          <div className="ml-7 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-black dark:bg-white rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
