import { COLS, EscPosBuilder } from "./escpos";
import {
  BUSINESS_ADDRESS,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  BUSINESS_TAGLINE,
  LAYAWAY_FOOTER,
  SALE_FOOTER,
} from "./business-config";

export interface TicketItemData {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleTicketData {
  ticketNumber: string;
  date: Date;
  customerName?: string | null;
  items: TicketItemData[];
  total: number;
}

export interface LayawayTicketData {
  folio: string;
  date: Date;
  customerName: string;
  items: TicketItemData[];
  total: number;
  /** Cantidad que dejó al apartar. */
  deposit: number;
}

/** Línea lógica del ticket; la consumen el render ESC/POS y el de HTML. */
export type TicketLine =
  | { kind: "text"; text: string; align?: "left" | "center" | "right"; bold?: boolean }
  | { kind: "row"; left: string; right: string; bold?: boolean }
  | { kind: "rule"; char: "=" | "-" };

const money = (n: number) =>
  `$${n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatTicketDate = (d: Date) =>
  d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export const formatTicketTime = (d: Date) =>
  d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

function header(title: string): TicketLine[] {
  const lines: TicketLine[] = [
    { kind: "rule", char: "=" },
    { kind: "text", text: title, align: "center", bold: true },
    { kind: "rule", char: "=" },
    { kind: "text", text: BUSINESS_NAME, align: "center", bold: true },
    { kind: "text", text: BUSINESS_TAGLINE, align: "center" },
  ];
  for (const l of BUSINESS_ADDRESS) {
    lines.push({ kind: "text", text: l, align: "center" });
  }
  if (BUSINESS_PHONE) {
    lines.push({ kind: "text", text: `Tel: ${BUSINESS_PHONE}`, align: "center" });
  }
  lines.push({ kind: "rule", char: "=" });
  return lines;
}

function itemLines(items: TicketItemData[]): TicketLine[] {
  const lines: TicketLine[] = [];
  for (const item of items) {
    lines.push({ kind: "text", text: item.name.toUpperCase(), bold: true });
    lines.push({
      kind: "row",
      left: `  ${item.quantity} x ${money(item.unitPrice)}`,
      right: money(item.totalPrice),
    });
  }
  return lines;
}

export function saleTicketLines(sale: SaleTicketData): TicketLine[] {
  const lines = header("TICKET DE VENTA");
  lines.push(
    { kind: "text", text: `Ticket: ${sale.ticketNumber}`, align: "center" },
    {
      kind: "text",
      text: `Fecha: ${formatTicketDate(sale.date)}  ${formatTicketTime(sale.date)}`,
      align: "center",
    }
  );
  if (sale.customerName) {
    lines.push({ kind: "text", text: `Cliente: ${sale.customerName}` });
  }
  lines.push({ kind: "rule", char: "-" });
  lines.push(...itemLines(sale.items));
  lines.push(
    { kind: "rule", char: "-" },
    { kind: "row", left: "TOTAL:", right: money(sale.total), bold: true },
    { kind: "rule", char: "=" }
  );
  for (const l of SALE_FOOTER) {
    lines.push({ kind: "text", text: l, align: "center", bold: true });
  }
  return lines;
}

export function layawayTicketLines(l: LayawayTicketData): TicketLine[] {
  const balance = Math.max(0, l.total - l.deposit);
  const lines = header("TICKET DE APARTADO");
  lines.push(
    { kind: "text", text: `Folio: ${l.folio}`, align: "center" },
    { kind: "text", text: `Aparta: ${l.customerName}`, bold: true },
    { kind: "text", text: `Fecha: ${formatTicketDate(l.date)}` },
    { kind: "text", text: `Hora:  ${formatTicketTime(l.date)}` },
    { kind: "rule", char: "-" }
  );
  lines.push(...itemLines(l.items));
  lines.push(
    { kind: "rule", char: "-" },
    { kind: "row", left: "TOTAL:", right: money(l.total) },
    { kind: "row", left: "DEJO:", right: money(l.deposit), bold: true },
    { kind: "row", left: "SALDO:", right: money(balance), bold: true },
    { kind: "rule", char: "=" }
  );
  for (const t of LAYAWAY_FOOTER) {
    lines.push({ kind: "text", text: t, align: "center" });
  }
  return lines;
}

export function linesToEscPos(lines: TicketLine[]): Uint8Array {
  const b = new EscPosBuilder().init80();
  for (const l of lines) {
    if (l.kind === "rule") b.rule(l.char);
    else if (l.kind === "row") b.row(l.left, l.right, { bold: l.bold });
    else b.line(l.text, { align: l.align, bold: l.bold });
  }
  return b.align("left").bold(false).feed(4).cut().build();
}

export const buildSaleTicket = (sale: SaleTicketData) =>
  linesToEscPos(saleTicketLines(sale));

export const buildLayawayTicket = (layaway: LayawayTicketData) =>
  linesToEscPos(layawayTicketLines(layaway));

/** Convierte las líneas a texto monoespaciado de COLS columnas (respaldo HTML). */
export function linesToPlainText(lines: TicketLine[]): string {
  return lines
    .map((l) => {
      if (l.kind === "rule") return l.char.repeat(COLS);
      if (l.kind === "row") {
        const space = Math.max(1, COLS - l.left.length - l.right.length);
        return l.left + " ".repeat(space) + l.right;
      }
      if (l.align === "center") {
        const pad = Math.max(0, Math.floor((COLS - l.text.length) / 2));
        return " ".repeat(pad) + l.text;
      }
      return l.text;
    })
    .join("\n");
}
