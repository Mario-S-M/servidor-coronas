import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createProductSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  categoria: z.enum(["coronas", "cruces", "arcos"], {
    message: "Categoría inválida",
  }),
  precioMenudeo: z.number().positive("El precio debe ser mayor a 0"),
  precioMayoreo: z.number().positive("El precio debe ser mayor a 0"),
  precioProduccion: z.number().positive("El precio debe ser mayor a 0"),
});

// Función para generar ID a partir del nombre
function generateProductId(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^a-z0-9\s]/g, "") // Eliminar caracteres especiales
    .trim()
    .replace(/\s+/g, "-"); // Reemplazar espacios con guiones
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { activo: true },
      orderBy: { categoria: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const productData = await request.json();
    const validatedData = createProductSchema.parse(productData);

    // Generar ID base desde el nombre
    let productId = generateProductId(validatedData.nombre);
    let counter = 1;

    // Verificar si existe y agregar sufijo si es necesario
    while (
      await prisma.product.findUnique({
        where: { id: productId },
      })
    ) {
      productId = `${generateProductId(validatedData.nombre)}-${counter}`;
      counter++;
    }

    const product = await prisma.product.create({
      data: {
        id: productId,
        nombre: validatedData.nombre,
        categoria: validatedData.categoria,
        precioMenudeo: validatedData.precioMenudeo,
        precioMayoreo: validatedData.precioMayoreo,
        precioProduccion: validatedData.precioProduccion,
        activo: true,
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

    console.error("Error al crear producto:", error);
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}
