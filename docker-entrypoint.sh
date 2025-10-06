#!/bin/sh
set -e

echo "🔍 Esperando a que PostgreSQL esté disponible..."

# Esperar a que la base de datos esté lista
max_attempts=30
attempt=0
until npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || [ $attempt -eq $max_attempts ]; do
  echo "⏳ PostgreSQL no está lista - esperando... (intento $((attempt + 1))/$max_attempts)"
  sleep 2
  attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ No se pudo conectar a PostgreSQL después de $max_attempts intentos"
  exit 1
fi

echo "✅ PostgreSQL está lista!"

echo "📦 Ejecutando migraciones de Prisma..."

# Intentar ejecutar migraciones, si falla por P3005, usar db push
if ! npx prisma migrate deploy 2>/dev/null; then
  echo "⚠️  Las migraciones no se pudieron aplicar (base de datos existente)"
  echo "📝 Sincronizando esquema con db push..."
  npx prisma db push --skip-generate --accept-data-loss
  echo "✅ Esquema sincronizado"
else
  echo "✅ Migraciones aplicadas exitosamente"
fi

echo "🚀 Iniciando aplicación con PM2..."
exec pm2-runtime start ecosystem.config.json
