import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Verificar la conexión con una consulta simple
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "connected",
      message: "Base de datos conectada correctamente con Prisma",
    });
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error);
    return NextResponse.json(
      { error: "Error de conexión a la base de datos" },
      { status: 500 }
    );
  }
}
