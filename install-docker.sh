#!/bin/bash

# Script de instalación de Docker para Raspberry Pi / Linux
# Este script instala Docker y Docker Compose

echo "🐳 Instalando Docker en Raspberry Pi/Linux..."
echo ""

# Verificar si ya está instalado
if command -v docker &> /dev/null; then
    echo "✅ Docker ya está instalado:"
    docker --version
    echo ""
else
    echo "📦 Instalando Docker..."
    
    # Actualizar repositorios
    sudo apt-get update
    
    # Instalar dependencias
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Descargar e instalar Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    
    # Limpiar
    rm get-docker.sh
    
    echo "✅ Docker instalado"
fi

# Verificar Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose ya está instalado:"
    docker-compose --version
    echo ""
else
    echo "📦 Instalando Docker Compose..."
    sudo apt-get install -y docker-compose
    echo "✅ Docker Compose instalado"
fi

# Agregar usuario al grupo docker
echo "👤 Agregando usuario al grupo docker..."
sudo usermod -aG docker $USER

echo ""
echo "✅ Instalación completada!"
echo ""
echo "⚠️  IMPORTANTE: Debes cerrar sesión y volver a entrar para que los cambios surtan efecto."
echo ""
echo "📋 Siguiente paso:"
echo "   1. Cierra sesión: exit"
echo "   2. Vuelve a entrar por SSH"
echo "   3. Ejecuta: ./deploy.sh"
echo ""
echo "O ejecuta esto para aplicar cambios sin cerrar sesión:"
echo "   newgrp docker"
echo ""
