#!/bin/bash

cat << 'EOF'
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🔄 Actualización de Balance Coronas en Raspberry     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

📝 INSTRUCCIONES PASO A PASO:

1️⃣  Pull de los últimos cambios desde GitHub:

   git pull origin main

2️⃣  Detener contenedores actuales:

   sudo docker-compose down

3️⃣  Reconstruir la imagen SIN CACHE (importante):

   sudo docker-compose build --no-cache

4️⃣  Levantar servicios con la nueva imagen:

   sudo docker-compose up -d

5️⃣  Verificar logs (deberías ver el mensaje correcto):

   sudo docker-compose logs -f app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ LO QUE DEBERÍAS VER EN LOS LOGS:

🔍 Esperando a que PostgreSQL esté disponible...
✅ PostgreSQL está lista!
📦 Ejecutando migraciones de Prisma...
⚠️  Las migraciones no se pudieron aplicar (base de datos existente)
📝 Sincronizando esquema con db push...
✅ Esquema sincronizado
🚀 Iniciando aplicación con PM2...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 SI PREFIERES EMPEZAR CON BASE DE DATOS LIMPIA:

   # Esto BORRARÁ todos los datos
   sudo docker-compose down -v
   sudo docker-compose up -d --build

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 COMANDO TODO-EN-UNO (copia y pega):

   git pull origin main && \
   sudo docker-compose down && \
   sudo docker-compose build --no-cache && \
   sudo docker-compose up -d && \
   echo "" && \
   echo "✅ Actualización completa!" && \
   echo "📊 Ver logs:" && \
   echo "   sudo docker-compose logs -f app"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 VERIFICACIÓN:

   # Ver estado de contenedores
   sudo docker-compose ps

   # Acceder a la aplicación
   http://localhost:3001

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
