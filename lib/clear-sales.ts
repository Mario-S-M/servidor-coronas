import prisma from "./prisma";

async function clearSales() {
  try {
    console.log("Eliminando todas las ventas...");

    // Eliminar primero los items de venta (por la relación de clave foránea)
    await prisma.saleItem.deleteMany();
    console.log("✓ Items de venta eliminados");

    // Eliminar las ventas
    await prisma.sale.deleteMany();
    console.log("✓ Ventas eliminadas");

    console.log("✓ Base de datos limpiada exitosamente");
  } catch (error) {
    console.error("Error al limpiar la base de datos:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la limpieza
clearSales()
  .then(() => {
    console.log("Proceso completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error en el proceso:", error);
    process.exit(1);
  });
