import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SaleType } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const tipo = searchParams.get("tipo");

  const saleWhere: Record<string, unknown> = {};

  if (desde || hasta) {
    saleWhere.createdAt = {
      ...(desde ? { gte: new Date(desde) } : {}),
      ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999Z`) } : {}),
    };
  }

  if (tipo && tipo !== "all") {
    saleWhere.type = tipo as SaleType;
  }

  const saleItems = await prisma.saleItem.findMany({
    where: { sale: saleWhere },
    include: {
      product: { select: { categoria: true } },
    },
  });

  const map = new Map<string, Map<string, { cantidad: number; ingresos: number }>>();

  for (const item of saleItems) {
    const cat = item.product.categoria;
    const prod = item.productName;

    if (!map.has(cat)) map.set(cat, new Map());
    const prodMap = map.get(cat)!;

    const existing = prodMap.get(prod) ?? { cantidad: 0, ingresos: 0 };
    prodMap.set(prod, {
      cantidad: existing.cantidad + item.quantity,
      ingresos: existing.ingresos + Number(item.totalPrice),
    });
  }

  const result = Array.from(map.entries())
    .map(([categoria, prods]) => {
      const productos = Array.from(prods.entries())
        .map(([nombre, stats]) => ({ nombre, ...stats }))
        .sort((a, b) => b.cantidad - a.cantidad);

      return {
        categoria,
        totalCantidad: productos.reduce((s, p) => s + p.cantidad, 0),
        totalIngresos: Number(productos.reduce((s, p) => s + p.ingresos, 0).toFixed(2)),
        productos,
      };
    })
    .sort((a, b) => b.totalCantidad - a.totalCantidad);

  return NextResponse.json(result);
}
