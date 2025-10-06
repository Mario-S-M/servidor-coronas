#!/bin/bash

echo "🗑️  Limpieza de Base de Datos - Balance Coronas"
echo ""
echo "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos"
echo ""
read -p "¿Estás seguro? (escribe 'SI' para confirmar): " confirm

if [ "$confirm" != "SI" ]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo ""
echo "🛑 Deteniendo contenedores..."
docker-compose down

echo ""
echo "🗑️  Eliminando volúmenes (datos de PostgreSQL)..."
docker-compose down -v

echo ""
echo "🔨 Reconstruyendo y levantando servicios..."
docker-compose up -d --build

echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

echo ""
echo "📊 Estado de los servicios:"
docker-compose ps

echo ""
echo "✅ Base de datos limpia y reiniciada"
echo ""
echo "📍 Servicios disponibles:"
echo "   - App: http://localhost:3001"
echo "   - Adminer: http://localhost:8081"
echo ""
echo "💡 Para poblar con datos de prueba, ejecuta:"
echo "   docker-compose exec app npm run db:seed"
echo ""
