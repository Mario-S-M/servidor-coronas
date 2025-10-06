@echo off
echo 🔍 Verificando configuración de Docker...
echo.

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker no está instalado
    exit /b 1
) else (
    echo ✅ Docker instalado
)

REM Verificar Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose no está instalado
    exit /b 1
) else (
    echo ✅ Docker Compose instalado
)

REM Verificar que Docker está corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker no está corriendo. Inicia Docker Desktop
    exit /b 1
) else (
    echo ✅ Docker está corriendo
)

REM Verificar archivos necesarios
if not exist "Dockerfile" (
    echo ❌ Dockerfile no encontrado
    exit /b 1
) else (
    echo ✅ Dockerfile encontrado
)

if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml no encontrado
    exit /b 1
) else (
    echo ✅ docker-compose.yml encontrado
)

if not exist "ecosystem.config.json" (
    echo ❌ ecosystem.config.json no encontrado
    exit /b 1
) else (
    echo ✅ ecosystem.config.json encontrado
)

if not exist "docker-entrypoint.sh" (
    echo ❌ docker-entrypoint.sh no encontrado
    exit /b 1
) else (
    echo ✅ docker-entrypoint.sh encontrado
)

REM Verificar puertos disponibles
netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 3001 está en uso
    echo    Para liberar: netstat -ano ^| findstr :3001
) else (
    echo ✅ Puerto 3001 disponible
)

netstat -ano | findstr :5432 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 5432 está en uso
    echo    Para liberar: netstat -ano ^| findstr :5432
) else (
    echo ✅ Puerto 5432 disponible
)

netstat -ano | findstr :8081 >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 8081 está en uso
    echo    Para liberar: netstat -ano ^| findstr :8081
) else (
    echo ✅ Puerto 8081 disponible
)

echo.
echo ✨ Verificación completa!
echo.
echo 📋 Siguiente paso:
echo    docker-compose up -d --build
echo.

pause
