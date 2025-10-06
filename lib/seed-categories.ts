import prisma from "./prisma";

async function seedCategories() {
  console.log("Creando categorías iniciales...");

  const categories = [
    { nombre: "Coronas", orden: 1 },
    { nombre: "Cruces", orden: 2 },
    { nombre: "Arcos", orden: 3 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { nombre: category.nombre },
      update: {},
      create: {
        nombre: category.nombre,
        orden: category.orden,
        activo: true,
      },
    });
  }

  console.log("Categorías creadas correctamente");
}

seedCategories()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
