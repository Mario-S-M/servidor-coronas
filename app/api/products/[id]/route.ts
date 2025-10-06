import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateProductSchema = z.object({
  nombre: z.string().optional(),
  precioMenudeo: z.number().positive(),
  precioMayoreo: z.number().positive(),
  precioProduccion: z.number().positive(),
  categoria: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Si se está actualizando la categoría, verificar que exista
    if (validatedData.categoria) {
      const categoryExists = await prisma.category.findFirst({
        where: {
          nombre: validatedData.categoria,
          activo: true,
        },
      });

      if (!categoryExists) {
        return NextResponse.json(
          { error: `La categoría "${validatedData.categoria}" no existe` },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(validatedData.nombre && { nombre: validatedData.nombre }),
        precioMenudeo: validatedData.precioMenudeo,
        precioMayoreo: validatedData.precioMayoreo,
        precioProduccion: validatedData.precioProduccion,
        ...(validatedData.categoria && { categoria: validatedData.categoria }),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error al actualizar producto:", error);
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Marcar como inactivo en lugar de eliminar
    await prisma.product.update({
      where: { id },
      data: { activo: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}
