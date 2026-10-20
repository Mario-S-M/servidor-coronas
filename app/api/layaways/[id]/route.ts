import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { serializeLayaway } from "@/lib/layaways";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["activo", "entregado", "cancelado"]),
});

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const layaway = await prisma.layaway.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    if (!layaway) {
      return NextResponse.json(
        { error: "Apartado no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(serializeLayaway(layaway));
  } catch (error) {
    console.error("Error al obtener apartado:", error);
    return NextResponse.json(
      { error: "Error al obtener apartado" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    const layaway = await prisma.layaway.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { items: true, payments: true },
    });
    return NextResponse.json(serializeLayaway(layaway));
  } catch (error) {
    console.error("Error al actualizar apartado:", error);
    return NextResponse.json(
      { error: "Error al actualizar apartado" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.layaway.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al eliminar apartado:", error);
    return NextResponse.json(
      { error: "Error al eliminar apartado" },
      { status: 500 }
    );
  }
}
