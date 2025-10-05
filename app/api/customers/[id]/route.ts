import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, telefono } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    if (!telefono || telefono.length !== 10) {
      return NextResponse.json(
        { error: "El teléfono debe tener 10 dígitos" },
        { status: 400 }
      );
    }

    // Verificar si el teléfono ya existe en otro cliente
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        telefono,
        id: { not: id },
        activo: true,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "Ya existe un cliente con este teléfono" },
        { status: 400 }
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        telefono,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return NextResponse.json(
      { error: "Error al actualizar el cliente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete: marcar como inactivo
    await prisma.customer.update({
      where: { id },
      data: {
        activo: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return NextResponse.json(
      { error: "Error al eliminar el cliente" },
      { status: 500 }
    );
  }
}
