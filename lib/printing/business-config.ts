// Datos fijos del negocio para los tickets (equivale a business_config.dart).
// Deja vacío un campo para que no se imprima.

export const BUSINESS_NAME = "Coronas PEKKA";
export const BUSINESS_TAGLINE = "Artículos Funerarios";
export const BUSINESS_ADDRESS: string[] = [];
export const BUSINESS_PHONE = "";

export const SALE_FOOTER = ["Gracias por su preferencia"];
export const LAYAWAY_FOOTER = [
  "Conserve este ticket",
  "para recoger su apartado",
];
export const PEDIDO_FOOTER = [
  "Conserve este ticket",
  "para recoger su pedido",
];

// Papel de 80 mm = 576 puntos; con la fuente A (12 puntos por caracter) caben 48 columnas.
// Si tu impresora imprime más angosto, baja este valor (por ejemplo 42).
export const PRINT_COLUMNS = 48;
// Renglones en blanco antes y después del contenido, para que no quede pegado al borde ni al corte.
export const TOP_FEED_LINES = 2;
export const BOTTOM_FEED_LINES = 5;
