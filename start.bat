@echo off
REM Script de inicio para Balance Coronas (Windows)

echo Iniciando Balance Coronas...

REM Verificar que PM2 esté instalado
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PM2 no esta instalado. Instalando PM2 globalmente...
    call npm install -g pm2
)

REM Detener instancias previas si existen
echo Deteniendo instancias previas...
call pm2 delete balance-coronas 2>nul

REM Crear directorio de logs si no existe
if not exist "logs" mkdir logs

REM Construir la aplicación
echo Construyendo aplicacion...
call npm run build

REM Iniciar con PM2
echo Iniciando con PM2...
call pm2 start ecosystem.config.json

REM Guardar configuración de PM2
echo Guardando configuracion de PM2...
call pm2 save

REM Configurar PM2 para iniciar en el arranque del sistema
echo Configurando PM2 para inicio automatico...
call pm2 startup

echo.
echo Balance Coronas iniciado exitosamente!
echo.
echo Comandos utiles:
echo   pm2 status           - Ver estado de la aplicacion
echo   pm2 logs            - Ver logs en tiempo real
echo   pm2 restart balance-coronas - Reiniciar aplicacion
echo   pm2 stop balance-coronas    - Detener aplicacion
echo   pm2 delete balance-coronas  - Eliminar de PM2
echo.
pause
