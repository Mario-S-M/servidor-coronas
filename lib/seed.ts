import prisma from "./prisma";

const initialProducts = [
  {
    id: "corona-ramo",
    nombre: "Corona de Ramo",
    precioMenudeo: 25.5,
    precioMayoreo: 20.0,
    precioProduccion: 15.0,
    categoria: "coronas",
  },
  {
    id: "corona-grande",
    nombre: "Corona grande con imagen",
    precioMenudeo: 20.0,
    precioMayoreo: 16.0,
    precioProduccion: 12.0,
    categoria: "coronas",
  },
  {
    id: "corona-mediana",
    nombre: "Corona mediana con imagen",
    precioMenudeo: 20.0,
    precioMayoreo: 16.0,
    precioProduccion: 12.0,
    categoria: "coronas",
  },
  {
    id: "corona-pequeña",
    nombre: "Corona pequeña con imagen",
    precioMenudeo: 20.0,
    precioMayoreo: 16.0,
    precioProduccion: 12.0,
    categoria: "coronas",
  },
  {
    id: "cruz-grande",
    nombre: "Cruz grande",
    precioMenudeo: 25.5,
    precioMayoreo: 20.0,
    precioProduccion: 15.0,
    categoria: "cruces",
  },
  {
    id: "cruz-mediana",
    nombre: "Cruz mediana",
    precioMenudeo: 20.0,
    precioMayoreo: 16.0,
    precioProduccion: 12.0,
    categoria: "cruces",
  },
  {
    id: "cruz-pequeña",
    nombre: "Cruz pequeña",
    precioMenudeo: 20.0,
    precioMayoreo: 16.0,
    precioProduccion: 12.0,
    categoria: "cruces",
  },
  {
    id: "arco-grande",
    nombre: "Arco grande",
    precioMenudeo: 25.5,
    precioMayoreo: 20.0,
    precioProduccion: 15.0,
    categoria: "arcos",
  },
  {
    id: "arco-mediano",
    nombre: "Arco mediano",
    precioMenudeo: 20.0,
    precioMayoreo: 16.0,
    precioProduccion: 12.0,
    categoria: "arcos",
  },
  {
    id: "arco-pequeño",
    nombre: "Arco pequeño",
    precioMenudeo: 20.0,
    precioMayoreo: 16.0,
    precioProduccion: 12.0,
    categoria: "arcos",
  },
];

export async function seedDatabase() {
  try {
    // Verificar si ya hay productos
    const count = await prisma.product.count();

    if (count === 0) {
      console.log("Poblando base de datos con productos iniciales...");

      for (const product of initialProducts) {
        await prisma.product.create({
          data: product,
        });
      }

      console.log(`✓ ${initialProducts.length} productos creados exitosamente`);
    } else {
      console.log(`✓ Base de datos ya contiene ${count} productos`);
    }
  } catch (error) {
    console.error("Error poblando la base de datos:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedDatabase()
  .then(() => {
    console.log("Seed completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error en seed:", error);
    process.exit(1);
  });
