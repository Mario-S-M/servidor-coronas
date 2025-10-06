import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    let totalIngresos = 0;
    let totalCostos = 0;
    let ventasMenudeo = 0;
    let ventasMayoreo = 0;
    let ingresosMenudeo = 0;
    let ingresosMayoreo = 0;
    let costosMenudeo = 0;
    let costosMayoreo = 0;

    sales.forEach((sale) => {
      const saleTotal = Number(sale.total);
      let saleCost = 0;

      sale.items.forEach((item) => {
        const precioProduccion = Number(item.product.precioProduccion);
        const itemCost = precioProduccion * item.quantity;
        saleCost += itemCost;
      });

      totalIngresos += saleTotal;
      totalCostos += saleCost;

      if (sale.type === "menudeo") {
        ventasMenudeo++;
        ingresosMenudeo += saleTotal;
        costosMenudeo += saleCost;
      } else {
        ventasMayoreo++;
        ingresosMayoreo += saleTotal;
        costosMayoreo += saleCost;
      }
    });

    const gananciaTotal = totalIngresos - totalCostos;
    const gananciaMenudeo = ingresosMenudeo - costosMenudeo;
    const gananciaMayoreo = ingresosMayoreo - costosMayoreo;
    const margenGanancia = totalIngresos > 0 ? (gananciaTotal / totalIngresos) * 100 : 0;

    return NextResponse.json({
      totalIngresos,
      totalCostos,
      gananciaTotal,
      margenGanancia,
      menudeo: {
        ventas: ventasMenudeo,
        ingresos: ingresosMenudeo,
        costos: costosMenudeo,
        ganancia: gananciaMenudeo,
      },
      mayoreo: {
        ventas: ventasMayoreo,
        ingresos: ingresosMayoreo,
        costos: costosMayoreo,
        ganancia: gananciaMayoreo,
      },
    });
  } catch (error) {
    console.error("Error al calcular ganancias:", error);
    return NextResponse.json(
      { error: "Error al calcular ganancias" },
      { status: 500 }
    );
  }
}
