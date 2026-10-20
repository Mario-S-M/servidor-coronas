import { withRealtime } from "@/lib/realtime/bus";
import { NextResponse } from "next/server";
import { z } from "zod";
import { saveAddonPrice } from "@/lib/pricing";

const schema = z
  .object({
    key: z.string().min(1),
    year: z.number().int().min(2000).max(2100),
    name: z.string().trim().min(1).max(60).optional(),
    price: z.number().min(0, "El precio no puede ser negativo").optional(),
    activo: z.boolean().optional(),
  })
  .refine(
    (d) => d.name !== undefined || d.price !== undefined || d.activo !== undefined,
    "Nada que guardar"
  );

/** Cambia el precio, el nombre o si se ofrece un extra en un año. */
async function handlePUT(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    await saveAddonPrice(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al guardar el extra:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al guardar" },
      { status: 500 }
    );
  }
}

export const PUT = withRealtime(["catalog"], handlePUT);
