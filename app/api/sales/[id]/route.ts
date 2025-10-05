import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    // Eliminar los items primero (por la relación)
    await prisma.saleItem.deleteMany({
      where: { saleId: id },
    });

    // Luego eliminar la venta
    await prisma.sale.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar venta:", error);
    return NextResponse.json(
      { error: "Error al eliminar venta" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const data = await request.json();

    // Actualizar la venta en una transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Eliminar items existentes
      await tx.saleItem.deleteMany({
        where: { saleId: id },
      });

      // Actualizar la venta con nuevos items
      return await tx.sale.update({
        where: { id },
        data: {
          type: data.type,
          total: data.total,
          totalItems: data.totalItems,
          items: {
            create: data.items.map(
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
        },
      });
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error al actualizar venta:", error);
    return NextResponse.json(
      { error: "Error al actualizar venta" },
      { status: 500 }
    );
  }
}
