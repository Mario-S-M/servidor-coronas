import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Solo se desactiva: los pedidos viejos conservan su color escrito
    await prisma.colorOption.update({ where: { id }, data: { activo: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error al quitar color:", error);
    return NextResponse.json({ error: "Error al quitar el color" }, { status: 500 });
  }
}
