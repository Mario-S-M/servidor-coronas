#!/bin/sh
set -e

echo "🔍 Esperando a que PostgreSQL esté disponible..."

# Esperar a que la base de datos esté lista
until npx prisma db push --skip-generate 2>/dev/null; do
  echo "⏳ PostgreSQL no está lista - esperando..."
  sleep 2
done

echo "✅ PostgreSQL está lista!"

echo "📦 Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

echo "🚀 Iniciando aplicación con PM2..."
exec pm2-runtime start ecosystem.config.json
