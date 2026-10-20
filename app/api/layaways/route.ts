import { withRealtime } from "@/lib/realtime/bus";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { layawayInclude, serializeLayaway } from "@/lib/layaways";
import { RAMO_KEY, productLabel } from "@/lib/pedidos-config";
import {
  currentYear,
  resolveAddonPrices,
  resolveProductPrices,
  yearRange,
} from "@/lib/pricing";

const text = (max: number) => z.string().trim().max(max).optional().nullable();

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  // Solo para pedidos
  colors: z.array(z.string().trim().min(1).max(50)).default([]),
  imagenDesc: text(200),
  cromoDesc: text(200),
  // Cada extra con su detalle; los ramos pueden repetirse con flor, color y cantidad
  addons: z
    .array(
      z.object({
        key: z.string().min(1),
        detail: text(200),
        // Ramos: cuántos, de qué flor y de qué color
        quantity: z.number().int().min(1).max(50).default(1),
        flor: text(100),
        color: text(50),
      })
    )
    .default([]),
});

const createSchema = z.object({
  kind: z.enum(["apartado", "pedido"]).default("apartado"),
  customerName: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  customerPhone: z.string().trim().max(20).optional().nullable(),
  deposit: z.number().min(0, "El anticipo no puede ser negativo"),
  items: z.array(itemSchema).min(1, "Agrega al menos un producto"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const kind = searchParams.get("kind");
    const addon = searchParams.get("addon");
    const production = searchParams.get("production");
    const q = searchParams.get("q")?.trim();
    const year = Number(searchParams.get("year")) || null;

    const layaways = await prisma.layaway.findMany({
      where: {
        ...(status === "activo" ||
        status === "entregado" ||
        status === "cancelado"
          ? { status }
          : {}),
        ...(kind === "apartado" || kind === "pedido" ? { kind } : {}),
        ...(production === "por_procesar" ||
        production === "procesando" ||
        production === "listo"
          ? { production }
          : {}),
        ...(year ? { createdAt: yearRange(year) } : {}),
        // Una clave de extra, o "imagen" para cualquier tamaño de imagen
        ...(addon
          ? {
              items: {
                some: {
                  addons: {
                    some: {
                      key:
                        addon === "imagen" ? { startsWith: "imagen:" } : addon,
                    },
                  },
                },
              },
            }
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
      include: layawayInclude,
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

async function handlePOST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    const { kind, customerName, customerPhone, deposit, items } = parsed.data;
    const isPedido = kind === "pedido";

    // Los precios son los del año en curso y salen de la base de datos, no del cliente
    const year = currentYear();
    const [products, addonPrices] = await Promise.all([
      resolveProductPrices(year),
      resolveAddonPrices(year),
    ]);
    const byId = new Map(products.map((p) => [p.id, p]));
    const addonByKey = new Map(addonPrices.map((a) => [a.key, a]));

    const lines = [];
    for (const item of items) {
      const product = byId.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productId}` },
          { status: 400 }
        );
      }
      const unitPrice = product.precioMenudeo;
      // En un pedido cada corona va por separado, con sus propios extras
      const quantity = isPedido ? 1 : item.quantity;

      const addons: {
        key: string;
        name: string;
        detail: string | null;
        quantity: number;
        price: number;
      }[] = [];
      if (isPedido) {
        const seen = new Set<string>();
        let sizes = 0;
        for (const { key, detail, quantity: qty, flor, color } of item.addons) {
          const def = addonByKey.get(key);
          if (!def) {
            return NextResponse.json(
              { error: "Ese extra ya no se ofrece este año" },
              { status: 400 }
            );
          }
          if (def.group === "imagen") {
            if (product.incluyeImagen) {
              return NextResponse.json(
                { error: "Esa corona ya trae imagen, no se cobra aparte" },
                { status: 400 }
              );
            }
            sizes++;
          }
          // Solo los ramos se pueden repetir en una corona
          if (key !== RAMO_KEY) {
            if (seen.has(key)) {
              return NextResponse.json(
                { error: `${def.name} solo se puede agregar una vez por corona` },
                { status: 400 }
              );
            }
            seen.add(key);
          } else if (!flor?.trim() || !color?.trim()) {
            return NextResponse.json(
              { error: "Escribe la flor y el color de cada ramo" },
              { status: 400 }
            );
          }
          const isRamo = key === RAMO_KEY;
          const count = isRamo ? qty : 1;
          addons.push({
            key: def.key,
            name: def.name,
            detail: isRamo
              ? `${flor!.trim()} (${color!.trim().toLowerCase()})`
              : detail?.trim() || null,
            quantity: count,
            price: def.price * count,
          });
        }
        if (sizes > 1) {
          return NextResponse.json(
            { error: "Elige un solo tamaño de imagen por corona" },
            { status: 400 }
          );
        }
      }

      const addonsTotal = addons.reduce((s, a) => s + a.price, 0);
      lines.push({
        productId: product.id,
        productName: productLabel(product.categoria, product.nombre),
        quantity,
        unitPrice,
        totalPrice: (unitPrice + addonsTotal) * quantity,
        ...(isPedido
          ? {
              color: item.colors.length ? item.colors.join(", ") : null,
              imagenDesc: item.imagenDesc || null,
              cromoDesc: item.cromoDesc || null,
              addons: { create: addons },
            }
          : {}),
      });
    }

    // Los colores nuevos se guardan en la lista para la próxima vez
    if (isPedido) {
      const names = [...new Set(items.flatMap((i) => i.colors))];
      const last = await prisma.colorOption.findFirst({ orderBy: { orden: "desc" } });
      let orden = last?.orden ?? 0;
      for (const name of names) {
        const existing = await prisma.colorOption.findFirst({
          where: { name: { equals: name, mode: "insensitive" } },
        });
        if (!existing) {
          await prisma.colorOption.create({ data: { name, orden: ++orden } });
        } else if (!existing.activo) {
          await prisma.colorOption.update({
            where: { id: existing.id },
            data: { activo: true },
          });
        }
      }
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
        folio: `${isPedido ? "P" : "A"}-${String(Date.now()).slice(-6)}`,
        kind,
        customerName,
        customerPhone: customerPhone || null,
        total,
        deposit,
        items: { create: lines },
        payments: deposit > 0 ? { create: [{ amount: deposit }] } : undefined,
      },
      include: layawayInclude,
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

export const POST = withRealtime(["layaways", "catalog"], handlePOST);
