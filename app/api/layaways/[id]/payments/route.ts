import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { serializeLayaway } from "@/lib/layaways";

type Params = { params: Promise<{ id: string }> };

const paymentSchema = z.object({
  amount: z.number().positive("El abono debe ser mayor a cero"),
});

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const parsed = paymentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const current = await prisma.layaway.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    if (!current) {
      return NextResponse.json(
        { error: "Apartado no encontrado" },
        { status: 404 }
      );
    }
    if (current.status !== "activo") {
      return NextResponse.json(
        { error: "Solo se pueden abonar apartados activos" },
        { status: 400 }
      );
    }

    const balance = serializeLayaway(current).balance;
    if (parsed.data.amount > balance) {
      return NextResponse.json(
        { error: "El abono no puede ser mayor al saldo pendiente" },
        { status: 400 }
      );
    }

    await prisma.layawayPayment.create({
      data: { layawayId: id, amount: parsed.data.amount },
    });
    const updated = await prisma.layaway.findUniqueOrThrow({
      where: { id },
      include: { items: true, payments: true },
    });
    return NextResponse.json(serializeLayaway(updated), { status: 201 });
  } catch (error) {
    console.error("Error al registrar abono:", error);
    return NextResponse.json(
      { error: "Error al registrar abono" },
      { status: 500 }
    );
  }
}
