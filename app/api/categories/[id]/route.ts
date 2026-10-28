import { withRealtime } from "@/lib/realtime/bus";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PUT - Actualizar categoría
async function handlePUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, orden, activo } = body;

    // Si se está actualizando el nombre, verificar que no exista otra categoría con ese nombre
    if (nombre) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          nombre,
          id: { not: id },
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: `Ya existe otra categoría con el nombre "${nombre}"` },
          { status: 400 }
        );
      }
    }

    // Los productos guardan la categoría por nombre: al renombrarla se actualizan juntos,
    // si no quedarían apuntando al nombre viejo
    const category = await prisma.$transaction(async (tx) => {
      const previous = await tx.category.findUnique({ where: { id } });
      const updated = await tx.category.update({
        where: { id },
        data: {
          ...(nombre !== undefined && { nombre }),
          ...(orden !== undefined && { orden }),
          ...(activo !== undefined && { activo }),
        },
      });
      if (previous && nombre && previous.nombre !== nombre) {
        await tx.product.updateMany({
          where: { categoria: previous.nombre },
          data: { categoria: nombre },
        });
      }
      return updated;
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error al actualizar categoría:", error);

    // Manejo específico para error de constraint único
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 400 }
      );
    }

    // Manejo para categoría no encontrada
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar categoría" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar categoría (hard delete)
async function handleDELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar si hay productos usando esta categoría
    const productsCount = await prisma.product.count({
      where: {
        categoria:
          (await prisma.category.findUnique({ where: { id } }))?.nombre || "",
        activo: true,
      },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar. Hay ${productsCount} producto(s) usando esta categoría`,
        },
        { status: 400 }
      );
    }

    // Eliminar físicamente la categoría
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al eliminar categoría" },
      { status: 500 }
    );
  }
}

export const PUT = withRealtime(["catalog"], handlePUT);
export const DELETE = withRealtime(["catalog"], handleDELETE);
