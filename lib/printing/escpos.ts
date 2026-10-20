// Comandos ESC/POS portados de zapateria_flutter/lib/services/esc_pos.dart

export const COLS = 32;

const ESC = 0x1b;
const GS = 0x1d;

const UNICODE_TO_CP437: Record<string, number> = {
  á: 0xa0,
  é: 0x82,
  í: 0xa1,
  ó: 0xa2,
  ú: 0xa3,
  ü: 0x81,
  ñ: 0xa4,
  É: 0x90,
  Ñ: 0xa5,
  Ü: 0x9a,
  "¿": 0xa8,
  "¡": 0xad,
  º: 0xa7,
  ª: 0xa6,
};

const ACCENT_FALLBACK: Record<string, string> = {
  Á: "A",
  Í: "I",
  Ó: "O",
  Ú: "U",
};

export function encodeCp437(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 128) {
      out.push(code);
    } else if (UNICODE_TO_CP437[ch] !== undefined) {
      out.push(UNICODE_TO_CP437[ch]);
    } else if (ACCENT_FALLBACK[ch]) {
      out.push(ACCENT_FALLBACK[ch].charCodeAt(0));
    } else {
      out.push(0x3f);
    }
  }
  return out;
}

export class EscPosBuilder {
  private bytes: number[] = [];

  /** Inicializa la impresora: ancho 80 mm (576 puntos) y CP437. */
  init80() {
    this.bytes.push(ESC, 0x40);
    this.bytes.push(GS, 0x57, 0x40, 0x02);
    this.bytes.push(ESC, 0x74, 0x00);
    return this;
  }

  align(mode: "left" | "center" | "right") {
    const n = mode === "left" ? 0 : mode === "center" ? 1 : 2;
    this.bytes.push(ESC, 0x61, n);
    return this;
  }

  bold(on: boolean) {
    this.bytes.push(ESC, 0x45, on ? 1 : 0);
    return this;
  }

  text(s: string) {
    this.bytes.push(...encodeCp437(s));
    return this;
  }

  newline() {
    this.bytes.push(0x0a);
    return this;
  }

  line(
    s: string,
    opts: { align?: "left" | "center" | "right"; bold?: boolean } = {}
  ) {
    this.align(opts.align ?? "left").bold(opts.bold ?? false);
    return this.text(s).newline();
  }

  /** Texto con la parte derecha alineada al borde a COLS columnas. */
  row(left: string, right: string, opts: { bold?: boolean } = {}) {
    const space = Math.max(1, COLS - left.length - right.length);
    return this.line(left + " ".repeat(space) + right, opts);
  }

  rule(ch: "=" | "-" = "-") {
    return this.line(ch.repeat(COLS), { align: "center" });
  }

  feed(n: number) {
    this.bytes.push(ESC, 0x64, n);
    return this;
  }

  /** Autocorte completo (GS V 0). */
  cut() {
    this.bytes.push(GS, 0x56, 0x00);
    return this;
  }

  build(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}
