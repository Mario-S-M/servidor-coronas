import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { currentYear, resolveProductPrices, saveProductPrice } from "@/lib/pricing";

const createProductSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  categoria: z.string().min(1, "La categoría es requerida"),
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
    const [products, prices] = await Promise.all([
      prisma.product.findMany({
        where: { activo: true },
        orderBy: { categoria: "asc" },
      }),
      resolveProductPrices(currentYear()),
    ]);
    const byId = new Map(prices.map((p) => [p.id, p]));

    // Los precios son los del año en curso; las ventas viejas conservan los suyos
    return NextResponse.json(
      products.map((p) => {
        const price = byId.get(p.id);
        return price
          ? {
              ...p,
              precioMenudeo: price.precioMenudeo,
              precioMayoreo: price.precioMayoreo,
              precioProduccion: price.precioProduccion ?? Number(p.precioProduccion),
            }
          : p;
      })
    );
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

    // Verificar que la categoría exista
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

    await saveProductPrice({
      productId: product.id,
      year: currentYear(),
      precioMenudeo: validatedData.precioMenudeo,
      precioMayoreo: validatedData.precioMayoreo,
      precioProduccion: validatedData.precioProduccion,
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
