import { withRealtime } from "@/lib/realtime/bus";
import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { COLOR_SUGGESTIONS } from "@/lib/pedidos-config";

export async function GET() {
  try {
    // La primera vez se cargan los colores de inicio; después se editan libremente
    if ((await prisma.colorOption.count()) === 0) {
      await prisma.colorOption.createMany({
        data: COLOR_SUGGESTIONS.map((name, orden) => ({ name, orden })),
        skipDuplicates: true,
      });
    }
    const colors = await prisma.colorOption.findMany({
      where: { activo: true },
      orderBy: [{ orden: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(colors);
  } catch (error) {
    console.error("Error al obtener colores:", error);
    return NextResponse.json({ error: "Error al obtener colores" }, { status: 500 });
  }
}

const createSchema = z.object({ name: z.string().trim().min(1).max(50) });

async function handlePOST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Escribe el nombre del color" }, { status: 400 });
    }
    const { name } = parsed.data;
    const last = await prisma.colorOption.findFirst({ orderBy: { orden: "desc" } });
    // Si el color estaba quitado, se vuelve a activar
    const color = await prisma.colorOption.upsert({
      where: { name },
      create: { name, orden: (last?.orden ?? 0) + 1 },
      update: { activo: true },
    });
    return NextResponse.json(color, { status: 201 });
  } catch (error) {
    console.error("Error al crear color:", error);
    return NextResponse.json({ error: "Error al crear el color" }, { status: 500 });
  }
}

export const POST = withRealtime(["catalog"], handlePOST);
