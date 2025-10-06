import prisma from "./prisma";

async function cleanupInactiveCategories() {
  console.log("🧹 Limpiando categorías inactivas...\n");

  // Obtener todas las categorías inactivas
  const inactiveCategories = await prisma.category.findMany({
    where: { activo: false },
  });

  if (inactiveCategories.length === 0) {
    console.log("✅ No hay categorías inactivas para limpiar\n");
    return;
  }

  console.log(
    `Encontradas ${inactiveCategories.length} categorías inactivas:\n`
  );

  for (const cat of inactiveCategories) {
    console.log(`  ❌ ${cat.nombre} (id: ${cat.id})`);

    // Verificar si hay productos usando esta categoría
    const productsCount = await prisma.product.count({
      where: { categoria: cat.nombre },
    });

    if (productsCount > 0) {
      console.log(
        `     ⚠️  No se puede eliminar: ${productsCount} producto(s) la usan`
      );
    } else {
      console.log(`     🗑️  Eliminando...`);
      await prisma.category.delete({
        where: { id: cat.id },
      });
      console.log(`     ✅ Eliminada`);
    }
  }

  console.log("\n✅ Limpieza completada!\n");
}

cleanupInactiveCategories()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
