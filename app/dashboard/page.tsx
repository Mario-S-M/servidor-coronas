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
import { BarChart3, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

export default function DashboardPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);

  useEffect(() => {
    loadSales();
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

  const chartData = {
    labels: dailySales.map((day) =>
      format(new Date(day.date), "d MMM", { locale: es })
    ),
    datasets: [
      {
        label: "Ingresos Diarios",
        data: dailySales.map((day) => day.total),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
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
          callback: function (value: string | number) {
            return "$" + Number(value).toLocaleString();
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
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
            <BarChart3 className="h-8 w-8 text-gray-700" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Resumen general de ventas</p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ingresos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <p className="text-2xl font-bold">
                  ${getTotalRevenue().toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
                <p className="text-2xl font-bold">{getTotalSales()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Promedio por Venta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <p className="text-2xl font-bold">
                  ${getAverageSale().toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Artículos Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-orange-600" />
                <p className="text-2xl font-bold">{getTotalItems()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfica */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Día</CardTitle>
          </CardHeader>
          <CardContent>
            {dailySales.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No hay datos para mostrar</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Resumen Diario</CardTitle>
            </CardHeader>
            <CardContent>
              {dailySales.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No hay datos disponibles</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dailySales
                    .slice(-7)
                    .reverse()
                    .map((day) => (
                      <div
                        key={day.date}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {format(
                              new Date(day.date),
                              "EEEE, d 'de' MMMM 'de' yyyy",
                              {
                                locale: es,
                              }
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            {day.count} ventas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
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
