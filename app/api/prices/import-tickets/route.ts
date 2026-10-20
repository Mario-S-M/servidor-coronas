import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  currentYear,
  resolveProductPrices,
  saveProductPrice,
  yearRange,
} from "@/lib/pricing";

const schema = z.object({ year: z.number().int().min(2000).max(2100) });

function mostFrequent(values: number[]): number | null {
  if (!values.length) return null;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

/**
 * Recupera los precios de un año a partir de los tickets: toma el precio unitario
 * que más se vendió de cada producto, por separado en menudeo y mayoreo.
 * Solo crea los productos que ese año todavía no tienen precio guardado.
 */
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Año inválido" }, { status: 400 });
    }
    const { year } = parsed.data;
    if (year >= currentYear()) {
      // En el año en curso el precio vigente es el que se captura, no el de los tickets
      return NextResponse.json(
        { error: "Solo se pueden recuperar precios de años anteriores" },
        { status: 400 }
      );
    }

    const [items, existing, base] = await Promise.all([
      prisma.saleItem.findMany({
        where: { sale: { createdAt: yearRange(year) } },
        select: {
          productId: true,
          unitPrice: true,
          sale: { select: { type: true } },
        },
      }),
      prisma.productPrice.findMany({ where: { year } }),
      resolveProductPrices(year),
    ]);
    const have = new Set(existing.map((r) => r.productId));
    const baseById = new Map(base.map((p) => [p.id, p]));

    const menudeo = new Map<string, number[]>();
    const mayoreo = new Map<string, number[]>();
    for (const it of items) {
      const bucket = it.sale.type === "menudeo" ? menudeo : mayoreo;
      const list = bucket.get(it.productId) ?? [];
      list.push(Number(it.unitPrice));
      bucket.set(it.productId, list);
    }

    const created: string[] = [];
    const partial: string[] = [];
    const productIds = new Set([...menudeo.keys(), ...mayoreo.keys()]);
    for (const productId of productIds) {
      const product = baseById.get(productId);
      if (!product || have.has(productId)) continue;
      const m = mostFrequent(menudeo.get(productId) ?? []);
      const w = mostFrequent(mayoreo.get(productId) ?? []);
      await saveProductPrice({
        productId,
        year,
        precioMenudeo: m ?? product.precioMenudeo,
        precioMayoreo: w ?? product.precioMayoreo,
        // El precio de producción no aparece en los tickets
        precioProduccion: null,
      });
      created.push(`${product.categoria} ${product.nombre}`);
      if (m === null || w === null) {
        partial.push(
          `${product.categoria} ${product.nombre} (${m === null ? "menudeo" : "mayoreo"})`
        );
      }
    }
    return NextResponse.json({ created: created.length, partial });
  } catch (error) {
    console.error("Error al importar precios:", error);
    return NextResponse.json(
      { error: "Error al importar los precios" },
      { status: 500 }
    );
  }
}
