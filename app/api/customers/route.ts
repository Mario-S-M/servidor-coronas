import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      where: { activo: true },
      include: {
        sales: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convertir Decimals a números
    const customersWithNumbers = customers.map((customer) => ({
      ...customer,
      sales: customer.sales.map((sale) => ({
        ...sale,
        total: Number(sale.total),
      })),
    }));

    return NextResponse.json(customersWithNumbers);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, telefono } = body;

    // Validaciones
    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    if (!telefono || telefono.length !== 10) {
      return NextResponse.json(
        { error: "El teléfono debe tener 10 dígitos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe un cliente con el mismo teléfono
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        telefono,
        activo: true,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "Ya existe un cliente con este teléfono" },
        { status: 409 }
      );
    }

    // Crear el cliente
    const customer = await prisma.customer.create({
      data: {
        nombre: nombre.trim(),
        telefono,
        activo: true,
      },
      include: {
        sales: true,
      },
    });

    // Convertir Decimals a números
    const customerWithNumbers = {
      ...customer,
      sales: customer.sales.map((sale) => ({
        ...sale,
        total: Number(sale.total),
      })),
    };

    return NextResponse.json(customerWithNumbers, { status: 201 });
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return NextResponse.json(
      { error: "Error al crear el cliente" },
      { status: 500 }
    );
  }
}
