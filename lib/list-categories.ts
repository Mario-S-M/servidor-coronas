import prisma from './prisma'

async function listCategories() {
  console.log('\n📁 Categorías en la base de datos:\n')
  
  const categories = await prisma.category.findMany({
    orderBy: { orden: 'asc' },
  })

  if (categories.length === 0) {
    console.log('  No hay categorías registradas')
  } else {
    categories.forEach(cat => {
      const status = cat.activo ? '✅' : '❌'
      console.log(`  ${status} ${cat.nombre} (orden: ${cat.orden}, id: ${cat.id})`)
    })
  }

  console.log(`\nTotal: ${categories.length} categorías\n`)
}

listCategories()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
