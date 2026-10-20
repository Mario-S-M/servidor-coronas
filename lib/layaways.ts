import type { Prisma } from "@prisma/client";

export type LayawayWithRelations = Prisma.LayawayGetPayload<{
  include: { items: true; payments: true };
}>;

/** Convierte los Decimal a número y agrega lo pagado y el saldo. */
export function serializeLayaway(layaway: LayawayWithRelations) {
  const total = Number(layaway.total);
  const paid = layaway.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return {
    id: layaway.id,
    folio: layaway.folio,
    customerName: layaway.customerName,
    customerPhone: layaway.customerPhone,
    status: layaway.status,
    createdAt: layaway.createdAt,
    total,
    deposit: Number(layaway.deposit),
    paid,
    balance: Math.max(0, total - paid),
    items: layaway.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
    payments: layaway.payments
      .map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        createdAt: p.createdAt,
      }))
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
  };
}

export type LayawayDTO = ReturnType<typeof serializeLayaway>;
