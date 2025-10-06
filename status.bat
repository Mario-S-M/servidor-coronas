@echo off
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║        Balance Coronas - Estado del Sistema           ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Verificar si Docker está corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker no está corriendo
    echo    Por favor inicia Docker Desktop
    exit /b 1
)

echo 📊 ESTADO DE CONTENEDORES
echo ══════════════════════════════════════════════════════════
docker-compose ps
echo.

echo 🔥 SALUD DE LOS SERVICIOS
echo ══════════════════════════════════════════════════════════
docker inspect coronas_app --format "App: {{.State.Health.Status}}" 2>nul || echo App: No corriendo
docker inspect coronas_postgres --format "PostgreSQL: {{.State.Health.Status}}" 2>nul || echo PostgreSQL: No corriendo
echo.

echo 🌐 SERVICIOS DISPONIBLES
echo ══════════════════════════════════════════════════════════
echo   - Aplicación:  http://localhost:3001
echo   - Adminer:     http://localhost:8081
echo   - PostgreSQL:  localhost:5432
echo.

echo 📝 PM2 ESTADO
echo ══════════════════════════════════════════════════════════
docker-compose exec app pm2 jlist 2>nul | findstr "pm_id\|status\|memory\|cpu" || echo No disponible
echo.

echo 💾 USO DE RECURSOS
echo ══════════════════════════════════════════════════════════
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" coronas_app coronas_postgres 2>nul || echo No disponible
echo.

echo 📊 LOGS RECIENTES (últimas 10 líneas)
echo ══════════════════════════════════════════════════════════
docker-compose logs --tail=10 app 2>nul || echo No disponible
echo.

echo ═══════════════════════════════════════════════════════════
echo 💡 Comandos útiles:
echo    docker-compose logs -f app     Ver logs en tiempo real
echo    docker-compose restart app     Reiniciar aplicación
echo    docker-compose exec app pm2 monit    Monitor de PM2
echo    docker-compose down            Detener todo
echo ═══════════════════════════════════════════════════════════
echo.

pause
