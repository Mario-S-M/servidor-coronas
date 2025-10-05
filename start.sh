#!/bin/bash

# Script de inicio para Balance Coronas
echo "🚀 Iniciando Balance Coronas..."

# Verificar que PM2 esté instalado
if ! command -v pm2 &> /dev/null
then
    echo "❌ PM2 no está instalado. Instalando PM2 globalmente..."
    npm install -g pm2
fi

# Detener instancias previas si existen
echo "🛑 Deteniendo instancias previas..."
pm2 delete balance-coronas 2>/dev/null || true

# Crear directorio de logs si no existe
mkdir -p logs

# Construir la aplicación
echo "🔨 Construyendo aplicación..."
npm run build

# Iniciar con PM2
echo "▶️  Iniciando con PM2..."
pm2 start ecosystem.config.json

# Guardar configuración de PM2
echo "💾 Guardando configuración de PM2..."
pm2 save

# Configurar PM2 para iniciar en el arranque del sistema
echo "⚙️  Configurando PM2 para inicio automático..."
pm2 startup

echo ""
echo "✅ Balance Coronas iniciado exitosamente!"
echo ""
echo "Comandos útiles:"
echo "  pm2 status           - Ver estado de la aplicación"
echo "  pm2 logs            - Ver logs en tiempo real"
echo "  pm2 restart balance-coronas - Reiniciar aplicación"
echo "  pm2 stop balance-coronas    - Detener aplicación"
echo "  pm2 delete balance-coronas  - Eliminar de PM2"
echo ""
