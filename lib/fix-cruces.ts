import prisma from "./prisma";

async function fixCruces() {
  console.log("Reactivando categoría Cruces...\n");

  const cruces = await prisma.category.findFirst({
    where: { nombre: "Cruces" },
  });

  if (cruces) {
    await prisma.category.update({
      where: { id: cruces.id },
      data: { activo: true, orden: 2 },
    });
    console.log("✅ Cruces reactivada y actualizada\n");
  }
}

fixCruces()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
