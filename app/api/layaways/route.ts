import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { serializeLayaway } from "@/lib/layaways";

const createSchema = z.object({
  customerName: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  customerPhone: z.string().trim().max(20).optional().nullable(),
  deposit: z.number().min(0, "El anticipo no puede ser negativo"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, "Agrega al menos un producto"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();

    const layaways = await prisma.layaway.findMany({
      where: {
        ...(status === "activo" ||
        status === "entregado" ||
        status === "cancelado"
          ? { status }
          : {}),
        ...(q
          ? {
              OR: [
                { customerName: { contains: q, mode: "insensitive" } },
                { folio: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { items: true, payments: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(layaways.map(serializeLayaway));
  } catch (error) {
    console.error("Error al obtener apartados:", error);
    return NextResponse.json(
      { error: "Error al obtener apartados" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    const { customerName, customerPhone, deposit, items } = parsed.data;

    // Los precios se toman de la base de datos (menudeo), no del cliente
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const lines = [];
    for (const item of items) {
      const product = byId.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productId}` },
          { status: 400 }
        );
      }
      const unitPrice = Number(product.precioMenudeo);
      lines.push({
        productId: product.id,
        productName: product.nombre,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
      });
    }

    const total = lines.reduce((sum, l) => sum + l.totalPrice, 0);
    if (deposit > total) {
      return NextResponse.json(
        { error: "El anticipo no puede ser mayor al total" },
        { status: 400 }
      );
    }

    const layaway = await prisma.layaway.create({
      data: {
        folio: `A-${String(Date.now()).slice(-6)}`,
        customerName,
        customerPhone: customerPhone || null,
        total,
        deposit,
        items: { create: lines },
        payments: deposit > 0 ? { create: [{ amount: deposit }] } : undefined,
      },
      include: { items: true, payments: true },
    });

    return NextResponse.json(serializeLayaway(layaway), { status: 201 });
  } catch (error) {
    console.error("Error al crear apartado:", error);
    return NextResponse.json(
      { error: "Error al crear apartado" },
      { status: 500 }
    );
  }
}
