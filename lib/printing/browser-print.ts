import { linesToPlainText, type TicketLine } from "./tickets";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Respaldo: imprime el ticket con el diálogo del sistema a 80 mm. */
export function printWithBrowser(lines: TicketLine[]) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ticket</title>
<style>
@page { size: 80mm auto; margin: 3mm; }
body { margin: 0; font-family: "Courier New", monospace; font-size: 9pt; }
pre { margin: 0; white-space: pre; }
</style></head><body><pre>${escapeHtml(linesToPlainText(lines))}</pre></body></html>`;

  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc || !frame.contentWindow) {
    frame.remove();
    throw new Error("No se pudo preparar la impresión");
  }
  doc.open();
  doc.write(html);
  doc.close();
  frame.contentWindow.focus();
  frame.contentWindow.print();
  setTimeout(() => frame.remove(), 2000);
}
