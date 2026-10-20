import { NextResponse } from "next/server";
import { z } from "zod";
import { saveProductPrice } from "@/lib/pricing";

const schema = z.object({
  productId: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  precioMenudeo: z.number().positive("El precio debe ser mayor a 0"),
  precioMayoreo: z.number().positive("El precio debe ser mayor a 0"),
  precioProduccion: z.number().positive().nullable().optional(),
});

export async function PUT(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }
    await saveProductPrice({
      ...parsed.data,
      precioProduccion: parsed.data.precioProduccion ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al guardar precio:", error);
    return NextResponse.json(
      { error: "Error al guardar el precio" },
      { status: 500 }
    );
  }
}
