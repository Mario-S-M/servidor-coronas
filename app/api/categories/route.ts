import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Obtener todas las categorías activas
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva categoría
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, orden } = body

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una categoría con ese nombre (incluyendo inactivas)
    const existingCategory = await prisma.category.findFirst({
      where: { nombre },
    })

    if (existingCategory) {
      const status = existingCategory.activo ? 'activa' : 'inactiva'
      console.log(`Categoría duplicada: "${nombre}" (${status}, id: ${existingCategory.id})`)
      return NextResponse.json(
        { error: `Ya existe una categoría con el nombre "${nombre}" (${status})` },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        nombre,
        orden: orden ?? 0,
        activo: true,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error al crear categoría:', error)
    
    // Manejo específico para error de constraint único
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    )
  }
}
