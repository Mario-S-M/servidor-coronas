import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ensureAddonDefs, saveAddonPrice } from "@/lib/pricing";
import { slugify } from "@/lib/pedidos-config";

const schema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre").max(60),
  group: z.enum(["extra", "imagen"]),
  price: z.number().min(0, "El precio no puede ser negativo"),
  year: z.number().int().min(2000).max(2100),
});

/** Crea un extra nuevo (o un tamaño de imagen) y lo ofrece desde el año indicado. */
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    const { name, group, price, year } = parsed.data;
    await ensureAddonDefs();

    const slug = slugify(name);
    if (!slug) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }
    const key = group === "imagen" ? `imagen:${slug}` : slug;
    if (await prisma.addonDef.findUnique({ where: { key } })) {
      return NextResponse.json(
        { error: "Ya existe un extra con ese nombre" },
        { status: 409 }
      );
    }

    const last = await prisma.addonDef.findFirst({ orderBy: { orden: "desc" } });
    await prisma.addonDef.create({
      data: { key, name, group, orden: (last?.orden ?? 0) + 1 },
    });
    await saveAddonPrice({ key, year, name, price, activo: true });
    return NextResponse.json({ key }, { status: 201 });
  } catch (error) {
    console.error("Error al crear extra:", error);
    return NextResponse.json({ error: "Error al crear el extra" }, { status: 500 });
  }
}
