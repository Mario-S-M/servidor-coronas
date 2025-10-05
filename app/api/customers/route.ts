import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      where: { activo: true },
      include: {
        sales: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convertir Decimals a números
    const customersWithNumbers = customers.map((customer) => ({
      ...customer,
      sales: customer.sales.map((sale) => ({
        ...sale,
        total: Number(sale.total),
      })),
    }));

    return NextResponse.json(customersWithNumbers);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}
