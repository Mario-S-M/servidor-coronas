# 🏪 Balance Coronas

Sistema de punto de venta y gestión de inventario para Coronas.

## 🚀 Inicio Rápido con Docker (Recomendado)

### Requisitos

- Docker Desktop instalado y corriendo
- Docker Compose

### Despliegue en un comando

**Windows:**

```powershell
.\deploy.bat
```

**Linux/Mac/Raspberry Pi:**

```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual

```powershell
# Levantar servicios
docker-compose up -d --build

# Ver logs
docker-compose logs -f app
```

## 📍 Servicios Disponibles

Después de `docker-compose up -d`:

- **Aplicación**: http://localhost:3001
- **Adminer (DB Manager)**: http://localhost:8081
- **PostgreSQL**: localhost:5432

## 💻 Desarrollo Local (Sin Docker)

### Requisitos

- Node.js 20+
- PostgreSQL 15+
- npm

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar base de datos
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones
npx prisma migrate deploy

# Seed (opcional)
npm run db:seed

# Iniciar en desarrollo
npm run dev
```

## 📚 Scripts Disponibles

```bash
npm run dev          # Desarrollo con Turbopack
npm run build        # Build de producción
npm start            # Iniciar producción
npm run start:pm2    # Iniciar con PM2
npm run db:seed      # Poblar base de datos
npm run db:studio    # Abrir Prisma Studio
```

## 🐳 Comandos Docker

```bash
# Levantar todo
docker-compose up -d --build

# Ver logs
docker-compose logs -f app

# Detener
docker-compose down

# Limpiar todo (incluyendo DB)
docker-compose down -v

# Ver estado de PM2
docker-compose exec app pm2 list

# Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# Seed
docker-compose exec app npm run db:seed
```

## 🏗️ Arquitectura

- **Frontend**: Next.js 15 con App Router
- **Backend**: API Routes de Next.js
- **Base de Datos**: PostgreSQL 15
- **ORM**: Prisma
- **UI**: Shadcn/UI + Tailwind CSS
- **Gestión de Estado**: Zustand
- **Validaciones**: Zod
- **Notificaciones**: Sonner
- **Process Manager**: PM2 (producción)

## 🔧 Tecnologías

- Next.js 15
- React 19
- TypeScript 5
- Prisma
- PostgreSQL
- Docker & Docker Compose
- PM2
- Tailwind CSS
- Shadcn/UI
- Recharts
- Zustand
- Zod

## 📂 Estructura del Proyecto

```
balance-coronas/
├── app/              # App Router de Next.js
│   ├── api/          # API Routes
│   ├── clientes/     # Páginas de clientes
│   ├── corte/        # Corte de caja
│   ├── dashboard/    # Dashboard
│   ├── historial/    # Historial de ventas
│   ├── mayoreo/      # Ventas mayoreo
│   └── precios/      # Gestión de precios
├── components/       # Componentes reutilizables
│   └── ui/          # Componentes de Shadcn/UI
├── lib/             # Utilidades y configuración
├── prisma/          # Schema y migraciones
└── public/          # Archivos estáticos
```

## 🔐 Variables de Entorno

```env
DATABASE_URL=postgresql://coronas_user:coronas_password@localhost:5432/coronas_db
NODE_ENV=production
PORT=3001
```

## 🛠️ Troubleshooting

### Puerto en uso

```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Error de migraciones

```bash
npx prisma migrate reset
npx prisma migrate deploy
```

### Rebuild completo

```bash
docker-compose down -v
docker-compose up -d --build
```

## 📝 Licencia

Privado - Todos los derechos reservados

## 👥 Autor

Mario S.M.

---

**¿Necesitas ayuda?** Revisa la documentación en la carpeta raíz o abre un issue.

## Impresión de tickets (impresora térmica Bluetooth)

Los tickets de venta y de apartado se imprimen desde el navegador con Web Bluetooth (BLE, papel de 80 mm, con autocorte).

- Requiere **Chrome en Android** (o Chrome/Edge en PC). No funciona en Safari/iOS.
- Web Bluetooth necesita contexto seguro. Si la app se abre por `http://IP:3001`, en Chrome Android entra a
  `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, agrega la URL de la app y reinicia Chrome.
- La impresora debe ser **BLE**. Si solo tiene Bluetooth clásico, usa "Imprimir con el navegador".
- Los datos del negocio del ticket están en `lib/printing/business-config.ts`.
- Los apartados se consultan en `/apartados`. Tras actualizar el código corre `npx prisma db push` para crear las tablas.

## Despliegue automático (GitHub Actions)

Cada push a `main` (`.github/workflows/deploy.yml`) construye la imagen `linux/arm64` en la Mac
con un runner propio, la manda por SSH a la Raspberry y reinicia solo el contenedor `coronas_app`.
Postgres no se toca. Si la app no responde en `/api/health`, el job falla y muestra los logs;
la imagen anterior queda como `servidor-coronas-app:previous`.

Requisitos en la Mac:
1. Docker Desktop abierto (que arranque al iniciar sesión).
2. Runner instalado: GitHub > Settings > Actions > Runners > New self-hosted runner (macOS, ARM64).
   Después de `./config.sh ...` ejecutar `./svc.sh install && ./svc.sh start` para que corra como servicio.
3. Acceso SSH sin contraseña a la Raspberry (`ssh rasp@raspberrypi.local`).

Opcional: variables `DEPLOY_HOST`, `DEPLOY_USER` y `DEPLOY_DIR` en Settings > Secrets and variables > Actions.
El repo es público: el workflow solo corre con push a `main`; no agregues disparadores `pull_request`
mientras use el runner propio. En Settings > Actions > General conviene exigir aprobación para PRs de colaboradores externos.

Volver a la versión anterior (en la Raspberry):
`docker tag servidor-coronas-app:previous servidor-coronas-app:latest && docker compose up -d --no-build --no-deps app`
