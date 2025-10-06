import prisma from './prisma'

async function reactivateCategories() {
  console.log('Reactivando categorías...\n')

  const categories = await prisma.category.findMany()

  for (const cat of categories) {
    console.log(`Reactivando: ${cat.nombre}`)
    await prisma.category.update({
      where: { id: cat.id },
      data: { activo: true },
    })
  }

  // Actualizar el orden correcto
  const updates = [
    { nombre: 'Coronas', orden: 1 },
    { nombre: 'Cruces', orden: 2 },
    { nombre: 'Arcos', orden: 3 },
    { nombre: 'Especiales', orden: 4 },
  ]

  console.log('\nActualizando orden...\n')
  
  for (const update of updates) {
    const cat = categories.find(c => c.nombre === update.nombre)
    if (cat) {
      console.log(`${update.nombre} → orden ${update.orden}`)
      await prisma.category.update({
        where: { id: cat.id },
        data: { orden: update.orden },
      })
    }
  }

  console.log('\n✅ Categorías reactivadas correctamente!\n')
}

reactivateCategories()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
