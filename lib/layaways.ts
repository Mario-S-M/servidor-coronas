import type { Prisma } from "@prisma/client";
import type { LayawayTicketData } from "@/lib/printing/tickets";

export const layawayInclude = {
  items: { include: { addons: true } },
  payments: true,
} satisfies Prisma.LayawayInclude;

export type LayawayWithRelations = Prisma.LayawayGetPayload<{
  include: typeof layawayInclude;
}>;

/** Convierte los Decimal a número y agrega lo pagado y el saldo. */
export function serializeLayaway(layaway: LayawayWithRelations) {
  const total = Number(layaway.total);
  const paid = layaway.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return {
    id: layaway.id,
    folio: layaway.folio,
    kind: layaway.kind,
    customerName: layaway.customerName,
    customerPhone: layaway.customerPhone,
    status: layaway.status,
    production: layaway.production,
    createdAt: layaway.createdAt.toISOString(),
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
      color: i.color,
      flores: i.flores,
      imagenDesc: i.imagenDesc,
      cromoDesc: i.cromoDesc,
      addons: i.addons.map((a) => ({
        id: a.id,
        key: a.key,
        name: a.name,
        detail: a.detail,
        price: Number(a.price),
      })),
    })),
    payments: layaway.payments
      .map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        createdAt: p.createdAt.toISOString(),
      }))
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
  };
}

export type LayawayDTO = ReturnType<typeof serializeLayaway>;

export const KIND_LABEL = { apartado: "Apartado", pedido: "Pedido" } as const;

export const PRODUCTION_LABEL = {
  por_procesar: "Por procesar",
  procesando: "Procesando",
  listo: "Listo",
} as const;

export const PRODUCTION_ORDER = ["por_procesar", "procesando", "listo"] as const;

export const STATUS_LABEL = {
  activo: "Activo",
  entregado: "Entregado",
  cancelado: "Cancelado",
} as const;

/** Datos para imprimir el ticket de un apartado o pedido. */
export function layawayToTicketData(l: LayawayDTO): LayawayTicketData {
  return {
    kind: l.kind,
    folio: l.folio,
    date: new Date(l.createdAt),
    customerName: l.customerName,
    total: l.total,
    deposit: l.deposit,
    items: l.items.map((i) => ({
      name: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
      details: [
        i.color ? `Color: ${i.color}` : null,
        i.flores ? `Flores: ${i.flores}` : null,
        i.imagenDesc ? `Imagen: ${i.imagenDesc}` : null,
        i.cromoDesc ? `Cromo: ${i.cromoDesc}` : null,
      ].filter((d): d is string => !!d),
      addons: i.addons.map((a) => ({
        name: a.detail ? `${a.name}: ${a.detail}` : a.name,
        price: a.price,
      })),
    })),
  };
}
