"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Percent } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTheme } from "@/lib/theme-context";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Sale {
  id: string;
  ticketNumber: string;
  type: string;
  total: number;
  totalItems: number;
  createdAt: string;
}

interface DailySales {
  date: string;
  total: number;
  count: number;
}

interface ProfitData {
  totalIngresos: number;
  totalCostos: number;
  gananciaTotal: number;
  margenGanancia: number;
  menudeo: {
    ventas: number;
    ingresos: number;
    costos: number;
    ganancia: number;
  };
  mayoreo: {
    ventas: number;
    ingresos: number;
    costos: number;
    ganancia: number;
  };
}

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    loadSales();
    loadProfits();
  }, []);

  useEffect(() => {
    if (sales.length > 0) {
      processDailySales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales]);

  const loadSales = async () => {
    try {
      const response = await fetch("/api/sales");
      if (response.ok) {
        const data = await response.json();
        const salesWithNumbers = data.map((sale: Sale) => ({
          ...sale,
          total:
            typeof sale.total === "number" ? sale.total : Number(sale.total),
        }));
        setSales(salesWithNumbers);
      }
    } catch (error) {
      console.error("Error al cargar ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfits = async () => {
    try {
      const response = await fetch("/api/dashboard/profits");
      if (response.ok) {
        const data = await response.json();
        setProfitData(data);
      }
    } catch (error) {
      console.error("Error al cargar ganancias:", error);
    }
  };

  const processDailySales = () => {
    const salesByDate: { [key: string]: { total: number; count: number } } = {};

    sales.forEach((sale) => {
      const date = new Date(sale.createdAt);
      const dateKey = format(date, "yyyy-MM-dd");

      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { total: 0, count: 0 };
      }

      salesByDate[dateKey].total += sale.total;
      salesByDate[dateKey].count += 1;
    });

    const dailyData: DailySales[] = Object.entries(salesByDate)
      .map(([date, data]) => ({
        date,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setDailySales(dailyData);
  };

  const getTotalRevenue = () => {
    return sales.reduce((sum, sale) => sum + sale.total, 0);
  };

  const getTotalSales = () => {
    return sales.length;
  };

  const getAverageSale = () => {
    if (sales.length === 0) return 0;
    return getTotalRevenue() / sales.length;
  };

  const getTotalItems = () => {
    return sales.reduce((sum, sale) => sum + sale.totalItems, 0);
  };

  // Colores dinámicos según el tema
  const lineColor = theme === "dark" ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)";
  const lineBackgroundColor =
    theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
  const gridColor =
    theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
  const textColor = theme === "dark" ? "#ffffff" : "#000000";

  const chartData = {
    labels: dailySales.map((day) =>
      format(new Date(day.date), "d MMM", { locale: es })
    ),
    datasets: [
      {
        label: "Ingresos Diarios",
        data: dailySales.map((day) => day.total),
        borderColor: lineColor,
        backgroundColor: lineBackgroundColor,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: lineColor,
        pointBorderColor: theme === "dark" ? "#000" : "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor:
          theme === "dark" ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.8)",
        titleColor: theme === "dark" ? "#000000" : "#ffffff",
        bodyColor: theme === "dark" ? "#000000" : "#ffffff",
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context: { parsed: { y: number } }) {
            return `Ingresos: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: textColor,
          callback: function (value: string | number) {
            return "$" + Number(value).toLocaleString();
          },
        },
        grid: {
          color: gridColor,
        },
      },
      x: {
        ticks: {
          color: textColor,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 bg-white dark:bg-black min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-white dark:bg-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-black dark:text-white" />
            <div>
              <h1 className="text-2xl font-bold text-black dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Resumen general de ventas
              </p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-black dark:border-white bg-white dark:bg-black">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Ingresos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-2xl font-bold text-black dark:text-white">
                  ${getTotalRevenue().toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black dark:border-white bg-white dark:bg-black">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-2xl font-bold text-black dark:text-white">
                  {getTotalSales()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black dark:border-white bg-white dark:bg-black">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Promedio por Venta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <p className="text-2xl font-bold text-black dark:text-white">
                  ${getAverageSale().toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black dark:border-white bg-white dark:bg-black">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Artículos Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <p className="text-2xl font-bold text-black dark:text-white">
                  {getTotalItems()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Ganancias */}
        {profitData && (
          <div className="mb-6">
            <Card className="border-black dark:border-white bg-white dark:bg-black">
              <CardHeader>
                <CardTitle className="text-black dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Análisis de Ganancias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 border border-black dark:border-white rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Ganancia Total
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${profitData.gananciaTotal.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 border border-black dark:border-white rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Costos Totales
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ${profitData.totalCostos.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 border border-black dark:border-white rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Margen de Ganancia
                    </p>
                    <div className="flex items-center gap-2">
                      <Percent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <p className="text-2xl font-bold text-black dark:text-white">
                        {profitData.margenGanancia.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border border-black dark:border-white rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Ingresos Totales
                    </p>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      ${profitData.totalIngresos.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Desglose por tipo de venta */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Menudeo */}
                  <div className="p-4 border border-black dark:border-white rounded-lg">
                    <h3 className="font-bold text-lg mb-4 text-black dark:text-white flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      Menudeo
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Ventas:</span>
                        <span className="font-semibold text-black dark:text-white">
                          {profitData.menudeo.ventas}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Ingresos:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${profitData.menudeo.ingresos.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Costos:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          ${profitData.menudeo.costos.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-black dark:border-white">
                        <span className="font-bold text-black dark:text-white">Ganancia:</span>
                        <span className="font-bold text-xl text-green-600 dark:text-green-400">
                          ${profitData.menudeo.ganancia.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mayoreo */}
                  <div className="p-4 border border-black dark:border-white rounded-lg">
                    <h3 className="font-bold text-lg mb-4 text-black dark:text-white flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      Mayoreo
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Ventas:</span>
                        <span className="font-semibold text-black dark:text-white">
                          {profitData.mayoreo.ventas}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Ingresos:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${profitData.mayoreo.ingresos.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Costos:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          ${profitData.mayoreo.costos.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-black dark:border-white">
                        <span className="font-bold text-black dark:text-white">Ganancia:</span>
                        <span className="font-bold text-xl text-green-600 dark:text-green-400">
                          ${profitData.mayoreo.ganancia.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfica */}
        <Card className="border-black dark:border-white bg-white dark:bg-black">
          <CardHeader>
            <CardTitle className="text-black dark:text-white">
              Ingresos por Día
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailySales.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No hay datos para mostrar
                </p>
              </div>
            ) : (
              <div className="h-[400px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen por días */}
        <div className="mt-6">
          <Card className="border-black dark:border-white bg-white dark:bg-black">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">
                Resumen Diario
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailySales.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay datos disponibles
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dailySales
                    .slice(-7)
                    .reverse()
                    .map((day) => (
                      <div
                        key={day.date}
                        className="flex justify-between items-center p-3 border border-black dark:border-white rounded-lg bg-white dark:bg-black"
                      >
                        <div>
                          <p className="font-medium text-black dark:text-white">
                            {format(
                              new Date(day.date),
                              "EEEE, d 'de' MMMM 'de' yyyy",
                              {
                                locale: es,
                              }
                            )}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {day.count} ventas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-black dark:text-white">
                            ${day.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
