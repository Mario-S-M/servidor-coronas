#!/bin/sh
set -e

PRISMA="/app/node_modules/prisma/build/index.js"

echo "Esperando a que PostgreSQL esté disponible..."

max_attempts=30
attempt=0
until node $PRISMA db push --accept-data-loss; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "No se pudo conectar a PostgreSQL después de $max_attempts intentos"
    exit 1
  fi
  echo "PostgreSQL no está lista - esperando... (intento $attempt/$max_attempts)"
  sleep 3
done

echo "PostgreSQL está lista y esquema sincronizado!"

echo "Iniciando aplicación con PM2..."
exec pm2-runtime start ecosystem.config.json
