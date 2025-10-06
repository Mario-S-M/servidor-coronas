#!/bin/bash

cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          🍓 Balance Coronas - Raspberry Pi 🍓            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

❌ Error: Estás intentando ejecutar un archivo .bat (Windows)

✅ En Linux/Raspberry Pi debes usar:

   chmod +x deploy.sh
   ./deploy.sh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INSTRUCCIONES RÁPIDAS:

1️⃣  Dar permisos de ejecución:
   chmod +x deploy.sh

2️⃣  Ejecutar despliegue:
   ./deploy.sh

3️⃣  Acceder a la aplicación:
   http://localhost:3001

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Si no tienes Docker instalado:

   chmod +x install-docker.sh
   ./install-docker.sh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Documentación completa:
   cat RASPBERRY-PI-GUIDE.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆘 Comandos útiles:

   # Ver estado
   docker-compose ps

   # Ver logs
   docker-compose logs -f app

   # Detener
   docker-compose down

   # Reiniciar
   docker-compose restart app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
