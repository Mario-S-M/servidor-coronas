import { withRealtime } from "@/lib/realtime/bus";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  resolveAddonPrices,
  resolveProductPrices,
  saveAddonPrice,
  saveProductPrice,
} from "@/lib/pricing";

const schema = z.object({
  from: z.number().int().min(2000).max(2100),
  to: z.number().int().min(2000).max(2100),
});

/** Copia a `to` los precios de `from` que `to` todavía no tiene. No pisa nada. */
async function handlePOST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success || parsed.data.from === parsed.data.to) {
      return NextResponse.json({ error: "Años inválidos" }, { status: 400 });
    }
    const { from, to } = parsed.data;

    const [source, existingProducts, existingAddons, sourceAddons] =
      await Promise.all([
        resolveProductPrices(from),
        prisma.productPrice.findMany({ where: { year: to } }),
        prisma.addonPrice.findMany({ where: { year: to } }),
        resolveAddonPrices(from, { all: true }),
      ]);
    const haveProducts = new Set(existingProducts.map((r) => r.productId));
    const haveAddons = new Set(existingAddons.map((r) => r.key));

    let products = 0;
    for (const p of source) {
      if (haveProducts.has(p.id)) continue;
      await saveProductPrice({
        productId: p.id,
        year: to,
        precioMenudeo: p.precioMenudeo,
        precioMayoreo: p.precioMayoreo,
        precioProduccion: p.precioProduccion,
      });
      products++;
    }
    let addons = 0;
    for (const a of sourceAddons) {
      // Un extra que ese año no existía no se copia
      if (haveAddons.has(a.key) || (!a.activo && a.sourceYear === null)) continue;
      await saveAddonPrice({
        key: a.key,
        year: to,
        name: a.name,
        price: a.price,
        activo: a.activo,
      });
      addons++;
    }
    return NextResponse.json({ products, addons });
  } catch (error) {
    console.error("Error al copiar precios:", error);
    return NextResponse.json(
      { error: "Error al copiar los precios" },
      { status: 500 }
    );
  }
}

export const POST = withRealtime(["catalog"], handlePOST);
