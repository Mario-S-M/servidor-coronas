import { NextResponse } from "next/server";
import {
  availableYears,
  currentYear,
  resolveAddonPrices,
  resolveProductPrices,
} from "@/lib/pricing";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year")) || currentYear();
    // all=1: incluye los extras que ese año no se ofrecen (para poder activarlos)
    const all = searchParams.get("all") === "1";
    const [products, addons, years] = await Promise.all([
      resolveProductPrices(year),
      resolveAddonPrices(year, { all }),
      availableYears(),
    ]);
    return NextResponse.json({ year, years, products, addons });
  } catch (error) {
    console.error("Error al obtener precios:", error);
    return NextResponse.json(
      { error: "Error al obtener precios" },
      { status: 500 }
    );
  }
}
