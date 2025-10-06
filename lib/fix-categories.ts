import prisma from './prisma'

async function fixProductCategories() {
  console.log('Verificando y corrigiendo categorías de productos...')

  // Obtener todas las categorías válidas
  const categories = await prisma.category.findMany({
    where: { activo: true },
  })

  console.log('Categorías válidas:', categories.map(c => c.nombre))

  // Obtener todos los productos
  const products = await prisma.product.findMany({
    where: { activo: true },
  })

  console.log(`\nTotal de productos: ${products.length}`)

  let fixed = 0
  let errors = 0

  for (const product of products) {
    console.log(`\nRevisando producto: ${product.nombre}`)
    console.log(`  Categoría actual: ${product.categoria}`)

    // Verificar si la categoría existe (case-sensitive)
    const categoryExists = categories.find(c => c.nombre === product.categoria)

    if (!categoryExists) {
      console.log(`  ⚠️  Categoría "${product.categoria}" no existe`)
      
      // Intentar encontrar la categoría correcta
      let correctCategory = null
      
      const lowerName = product.nombre.toLowerCase()
      const lowerCategoria = product.categoria.toLowerCase()
      
      // Primero intentar por coincidencia case-insensitive de la categoría actual
      correctCategory = categories.find(c => c.nombre.toLowerCase() === lowerCategoria)
      
      // Si no, buscar por el nombre del producto
      if (!correctCategory) {
        if (lowerName.includes('corona')) {
          correctCategory = categories.find(c => c.nombre.toLowerCase() === 'coronas')
        } else if (lowerName.includes('cruz')) {
          correctCategory = categories.find(c => c.nombre.toLowerCase() === 'cruces')
        } else if (lowerName.includes('arco')) {
          correctCategory = categories.find(c => c.nombre.toLowerCase() === 'arcos')
        }
      }

      if (correctCategory) {
        console.log(`  ✅ Corrigiendo a: ${correctCategory.nombre}`)
        await prisma.product.update({
          where: { id: product.id },
          data: { categoria: correctCategory.nombre },
        })
        fixed++
      } else {
        console.log(`  ❌ No se pudo determinar la categoría correcta`)
        errors++
      }
    } else {
      console.log(`  ✓ Categoría correcta`)
    }
  }

  console.log(`\n\nResumen:`)
  console.log(`  Productos corregidos: ${fixed}`)
  console.log(`  Productos con errores: ${errors}`)
  console.log(`  Productos correctos: ${products.length - fixed - errors}`)
}

fixProductCategories()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
