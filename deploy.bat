@echo off
echo 🚀 Iniciando Balance Coronas con Docker...

REM Verificar si Docker está corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker no está corriendo. Por favor inicia Docker Desktop.
    exit /b 1
)

REM Detener contenedores anteriores si existen
echo 🛑 Deteniendo contenedores anteriores...
docker-compose down

REM Construir y levantar servicios
echo 🔨 Construyendo y levantando servicios...
docker-compose up -d --build

REM Esperar a que la base de datos esté lista
echo ⏳ Esperando a que la base de datos esté lista...
timeout /t 15 /nobreak >nul

REM Ejecutar migraciones
echo 📦 Ejecutando migraciones de Prisma...
docker-compose exec app npx prisma migrate deploy

REM Preguntar por seed
echo.
echo 🌱 ¿Deseas ejecutar el seed de la base de datos? (s/n)
set /p response=
if /i "%response%"=="s" (
    docker-compose exec app npm run db:seed
)

echo.
echo ✅ ¡Aplicación lista!
echo.
echo 📍 Servicios disponibles:
echo    - App: http://localhost:3001
echo    - Adminer: http://localhost:8081
echo    - PostgreSQL: localhost:5432
echo.
echo 📊 Para ver los logs:
echo    docker-compose logs -f app
echo.
echo 🛑 Para detener:
echo    docker-compose down

pause
