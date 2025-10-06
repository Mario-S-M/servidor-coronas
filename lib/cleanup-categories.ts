import prisma from './prisma'

async function cleanupCategories() {
  console.log('Limpiando categorías duplicadas...')

  // Eliminar categorías en minúsculas (las del seed antiguo)
  const lowercaseCategories = ['coronas', 'cruces', 'arcos']

  for (const categoryName of lowercaseCategories) {
    const category = await prisma.category.findFirst({
      where: { nombre: categoryName },
    })

    if (category) {
      console.log(`Eliminando categoría en minúsculas: ${categoryName}`)
      await prisma.category.delete({
        where: { id: category.id },
      })
    }
  }

  // Actualizar productos que puedan tener referencias a categorías incorrectas
  const products = await prisma.product.findMany({
    where: { activo: true },
  })

  console.log('\nActualizando productos...')
  
  for (const product of products) {
    const lowerName = product.nombre.toLowerCase()
    let correctCategory = null

    if (lowerName.includes('corona')) {
      correctCategory = 'Coronas'
    } else if (lowerName.includes('cruz')) {
      correctCategory = 'Cruces'
    } else if (lowerName.includes('arco')) {
      correctCategory = 'Arcos'
    }

    if (correctCategory && product.categoria !== correctCategory) {
      console.log(`Actualizando ${product.nombre}: "${product.categoria}" → "${correctCategory}"`)
      await prisma.product.update({
        where: { id: product.id },
        data: { categoria: correctCategory },
      })
    }
  }

  console.log('\nLimpieza completada!')
}

cleanupCategories()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
