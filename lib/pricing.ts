import prisma from "@/lib/prisma";
import { ADDON_SEEDS, type AddonGroup } from "@/lib/pedidos-config";

export const currentYear = () => new Date().getFullYear();

export interface ProductPriceRow {
  id: string;
  nombre: string;
  categoria: string;
  precioMenudeo: number;
  precioMayoreo: number;
  precioProduccion: number | null;
  /** Año del que sale el precio; null = precio base del producto sin año. */
  sourceYear: number | null;
  /** true si el año pedido tiene su propio precio guardado. */
  exact: boolean;
}

export interface AddonPriceRow {
  key: string;
  name: string;
  group: AddonGroup;
  price: number;
  /** false = ese año el extra no se ofrece. */
  activo: boolean;
  sourceYear: number | null;
  exact: boolean;
}

/**
 * Precios de los productos para un año. Si ese año no tiene precio propio se usa
 * el del año anterior más reciente (así se puede vender el 1 de enero) y se marca
 * `exact: false` para avisar que falta capturar los precios del año.
 */
export async function resolveProductPrices(
  year: number
): Promise<ProductPriceRow[]> {
  const [products, prices] = await Promise.all([
    prisma.product.findMany({
      where: { activo: true },
      orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
    }),
    prisma.productPrice.findMany({
      where: { year: { lte: year } },
      orderBy: { year: "desc" },
    }),
  ]);

  // El primero de cada producto es el año más reciente <= year
  const latest = new Map<string, (typeof prices)[number]>();
  for (const p of prices) if (!latest.has(p.productId)) latest.set(p.productId, p);

  return products.map((p) => {
    const row = latest.get(p.id);
    if (!row) {
      return {
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria,
        precioMenudeo: Number(p.precioMenudeo),
        precioMayoreo: Number(p.precioMayoreo),
        precioProduccion: Number(p.precioProduccion),
        sourceYear: null,
        exact: false,
      };
    }
    return {
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      precioMenudeo: Number(row.precioMenudeo),
      precioMayoreo: Number(row.precioMayoreo),
      // null = ese año no registró precio de producción (no se arrastra el actual)
      precioProduccion:
        row.precioProduccion === null ? null : Number(row.precioProduccion),
      sourceYear: row.year,
      exact: row.year === year,
    };
  });
}

/** La primera vez se cargan los extras de inicio (pata, ramo, tres imágenes). */
export async function ensureAddonDefs() {
  if ((await prisma.addonDef.count()) > 0) return;
  await prisma.addonDef.createMany({
    data: ADDON_SEEDS.map((a, orden) => ({
      key: a.key,
      name: a.name,
      group: a.group,
      orden,
    })),
    skipDuplicates: true,
  });
}

/**
 * Extras y sus precios para un año. Un extra de inicio sin precio guardado usa su
 * valor de inicio; uno creado por el usuario solo se ofrece desde el año en que se
 * le puso precio. Por defecto solo devuelve los que se ofrecen ese año.
 */
export async function resolveAddonPrices(
  year: number,
  options: { all?: boolean } = {}
): Promise<AddonPriceRow[]> {
  await ensureAddonDefs();
  const [defs, rows] = await Promise.all([
    prisma.addonDef.findMany({ orderBy: [{ orden: "asc" }, { name: "asc" }] }),
    prisma.addonPrice.findMany({
      where: { year: { lte: year } },
      orderBy: { year: "desc" },
    }),
  ]);
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) if (!latest.has(r.key)) latest.set(r.key, r);

  const result = defs.map((def): AddonPriceRow => {
    const row = latest.get(def.key);
    if (row) {
      return {
        key: def.key,
        name: row.name,
        group: def.group,
        price: Number(row.price),
        activo: row.activo,
        sourceYear: row.year,
        exact: row.year === year,
      };
    }
    const seed = ADDON_SEEDS.find((a) => a.key === def.key);
    return {
      key: def.key,
      name: def.name,
      group: def.group,
      price: seed?.price ?? 0,
      activo: !!seed,
      sourceYear: null,
      exact: false,
    };
  });
  return options.all ? result : result.filter((r) => r.activo);
}

/** Años con datos de precios o ventas, más el actual y el siguiente. */
export async function availableYears(): Promise<number[]> {
  const [pp, ap, sales, layaways] = await Promise.all([
    prisma.productPrice.findMany({ select: { year: true }, distinct: ["year"] }),
    prisma.addonPrice.findMany({ select: { year: true }, distinct: ["year"] }),
    prisma.sale.findMany({ select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 }),
    prisma.layaway.findMany({ select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 }),
  ]);
  const years = new Set<number>([currentYear(), currentYear() + 1]);
  for (const r of [...pp, ...ap]) years.add(r.year);
  // Desde el año de la primera venta o apartado hasta hoy, sin huecos
  const firsts = [...sales, ...layaways].map((r) => r.createdAt.getFullYear());
  if (firsts.length) {
    for (let y = Math.min(...firsts); y <= currentYear(); y++) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

export const yearRange = (year: number) => ({
  gte: new Date(year, 0, 1),
  lt: new Date(year + 1, 0, 1),
});

/** Guarda el precio de un año; si es el año en curso también actualiza el espejo del producto. */
export async function saveProductPrice(input: {
  productId: string;
  year: number;
  precioMenudeo: number;
  precioMayoreo: number;
  precioProduccion: number | null;
}) {
  const { productId, year, ...prices } = input;

  // Al tocar un año anterior, primero se congelan los precios de hoy como los de este año.
  // Si no, el año en curso heredaría los precios viejos y las ventas de hoy saldrían con ellos.
  if (year < currentYear()) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product) {
      await prisma.productPrice.upsert({
        where: { productId_year: { productId, year: currentYear() } },
        create: {
          productId,
          year: currentYear(),
          precioMenudeo: product.precioMenudeo,
          precioMayoreo: product.precioMayoreo,
          precioProduccion: product.precioProduccion,
        },
        update: {},
      });
    }
  }

  const row = await prisma.productPrice.upsert({
    where: { productId_year: { productId, year } },
    create: { productId, year, ...prices },
    update: prices,
  });
  if (year === currentYear()) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        precioMenudeo: prices.precioMenudeo,
        precioMayoreo: prices.precioMayoreo,
        ...(prices.precioProduccion !== null && {
          precioProduccion: prices.precioProduccion,
        }),
      },
    });
  }
  return row;
}

/**
 * Guarda el precio y/o la disponibilidad de un extra en un año. Al tocar un año anterior
 * congela primero el del año en curso para que no herede el valor viejo.
 */
export async function saveAddonPrice(input: {
  key: string;
  year: number;
  name?: string;
  price?: number;
  activo?: boolean;
}) {
  const { key, year, name, price, activo } = input;
  await ensureAddonDefs();
  const def = await prisma.addonDef.findUnique({ where: { key } });
  if (!def) throw new Error(`Extra inválido: ${key}`);

  const all = await resolveAddonPrices(currentYear(), { all: true });
  const now = all.find((a) => a.key === key);

  if (year < currentYear()) {
    await prisma.addonPrice.upsert({
      where: { key_year: { key, year: currentYear() } },
      create: {
        key,
        year: currentYear(),
        name: now?.name ?? def.name,
        price: now?.price ?? 0,
        activo: now?.activo ?? false,
      },
      update: {},
    });
  }

  // Lo que no se manda se toma de lo que ese año ya tenía (o heredaba)
  const base = (await resolveAddonPrices(year, { all: true })).find((a) => a.key === key);
  return prisma.addonPrice.upsert({
    where: { key_year: { key, year } },
    create: {
      key,
      year,
      name: name ?? base?.name ?? def.name,
      price: price ?? base?.price ?? 0,
      activo: activo ?? base?.activo ?? true,
    },
    update: {
      ...(price !== undefined && { price }),
      ...(name && { name }),
      ...(activo !== undefined && { activo }),
    },
  });
}
