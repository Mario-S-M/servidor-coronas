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
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Convertir Decimals a números
    const salesWithNumbers = sales.map((sale) => ({
      ...sale,
      total: Number(sale.total),
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        product: item.product
          ? {
              ...item.product,
              precioMenudeo: Number(item.product.precioMenudeo),
              precioMayoreo: Number(item.product.precioMayoreo),
              precioProduccion: Number(item.product.precioProduccion),
            }
          : null,
      })),
    }));

    return NextResponse.json(salesWithNumbers);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return NextResponse.json(
      { error: "Error al obtener ventas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const saleData = await request.json();

    // Si es mayoreo y tiene información de cliente, buscar o crear cliente
    let customerId = null;
    if (
      saleData.type === "mayoreo" &&
      saleData.customerName &&
      saleData.customerPhone
    ) {
      // Buscar cliente existente por teléfono
      let customer = await prisma.customer.findUnique({
        where: { telefono: saleData.customerPhone },
      });

      // Si no existe, crear uno nuevo
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            nombre: saleData.customerName,
            telefono: saleData.customerPhone,
          },
        });
      }

      customerId = customer.id;
    }

    // Crear la venta con sus items en una transacción
    const sale = await prisma.sale.create({
      data: {
        ticketNumber: saleData.ticketNumber,
        type: saleData.type,
        total: saleData.total,
        totalItems: saleData.totalItems,
        customerName: saleData.customerName,
        customerPhone: saleData.customerPhone,
        customerId: customerId,
        items: {
          create: saleData.items.map(
            (item: {
              productId: string;
              productName: string;
              quantity: number;
              unitPrice: number;
              totalPrice: number;
            }) => ({
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              product: {
                connect: {
                  id: item.productId,
                },
              },
            })
          ),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error al crear venta:", error);
    return NextResponse.json(
      {
        error: "Error al crear venta",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
