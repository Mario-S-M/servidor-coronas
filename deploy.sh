#!/bin/bash

echo "🚀 Iniciando Balance Coronas con Docker..."

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo. Por favor inicia Docker Desktop."
    exit 1
fi

# Detener contenedores anteriores si existen
echo "🛑 Deteniendo contenedores anteriores..."
docker-compose down

# Construir y levantar servicios
echo "🔨 Construyendo y levantando servicios..."
docker-compose up -d --build

# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que la base de datos esté lista..."
sleep 10

# Ejecutar migraciones
echo "📦 Ejecutando migraciones de Prisma..."
docker-compose exec app npx prisma migrate deploy

# Ejecutar seed si es necesario
echo "🌱 ¿Deseas ejecutar el seed de la base de datos? (s/n)"
read -r response
if [[ "$response" =~ ^([sS])$ ]]; then
    docker-compose exec app npm run db:seed
fi

echo ""
echo "✅ ¡Aplicación lista!"
echo ""
echo "📍 Servicios disponibles:"
echo "   - App: http://localhost:3001"
echo "   - Adminer: http://localhost:8081"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "📊 Para ver los logs:"
echo "   docker-compose logs -f app"
echo ""
echo "🛑 Para detener:"
echo "   docker-compose down"
