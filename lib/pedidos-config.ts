// Valores de inicio de los extras de los pedidos. Solo se usan la primera vez para
// llenar la base de datos; después todo se edita en "Precios por año".

export type AddonGroup = "extra" | "imagen" | "ramo";

export interface AddonSeed {
  key: string;
  name: string;
  group: AddonGroup;
  price: number;
}

export const ADDON_SEEDS: AddonSeed[] = [
  { key: "pata", name: "Pata", group: "extra", price: 30 },
  { key: "ramo", name: "Ramo de flores", group: "ramo", price: 60 },
  { key: "imagen:chica", name: "Imagen chica", group: "imagen", price: 30 },
  { key: "imagen:mediana", name: "Imagen mediana", group: "imagen", price: 50 },
  { key: "imagen:grande", name: "Imagen grande", group: "imagen", price: 60 },
];

/** Clave del extra de ramos: se puede agregar varias veces a una misma corona. */
export const RAMO_KEY = "ramo";

export const COLOR_SUGGESTIONS = [
  "Blanco",
  "Rojo",
  "Rosa",
  "Amarillo",
  "Azul",
  "Morado",
  "Naranja",
  "Verde",
];

const SINGULAR: Record<string, string> = {
  coronas: "Corona",
  cruces: "Cruz",
  arcos: "Arco",
  ramos: "Ramo",
};

/** "Coronas" + "Grande" -> "Corona Grande" (en la base solo dice "Grande"). */
export function productLabel(categoria: string, nombre: string) {
  const base = SINGULAR[categoria.toLowerCase()] ?? categoria;
  return `${base} ${nombre}`;
}

/** Clave a partir del nombre: "Moño grande" -> "mono-grande". */
export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
