# 🐳 Despliegue con Docker

## Requisitos previos

- Docker Desktop instalado y corriendo
- Docker Compose

## 🚀 Inicio rápido

### Windows

```bash
.\deploy.bat
```

### Linux/Mac

```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual

```bash
# Construir y levantar servicios
docker-compose up -d --build

# Ver logs
docker-compose logs -f app

# Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# Ejecutar seed (opcional)
docker-compose exec app npm run db:seed
```

## 📍 Servicios

Una vez levantados los contenedores, tendrás acceso a:

- **Aplicación Next.js**: http://localhost:3001
- **Adminer (DB Manager)**: http://localhost:8081
- **PostgreSQL**: localhost:5432

## 🛠️ Comandos útiles

### Ver logs de la aplicación

```bash
docker-compose logs -f app
```

### Ver logs de PostgreSQL

```bash
docker-compose logs -f postgres
```

### Reiniciar la aplicación

```bash
docker-compose restart app
```

### Reconstruir la aplicación

```bash
docker-compose up -d --build app
```

### Detener todos los servicios

```bash
docker-compose down
```

### Detener y eliminar volúmenes (limpieza completa)

```bash
docker-compose down -v
```

## 🔍 Acceder al contenedor

```bash
# Acceder al shell del contenedor de la app
docker-compose exec app sh

# Acceder a PostgreSQL
docker-compose exec postgres psql -U coronas_user -d coronas_db
```

## 📊 PM2

La aplicación se ejecuta con PM2 dentro del contenedor. Para ver el estado:

```bash
docker-compose exec app pm2 list
docker-compose exec app pm2 logs
docker-compose exec app pm2 monit
```

## 🗃️ Base de datos

### Credenciales de PostgreSQL

- **Host**: localhost
- **Puerto**: 5432
- **Base de datos**: coronas_db
- **Usuario**: coronas_user
- **Contraseña**: coronas_password

### Adminer

Para gestionar la base de datos visualmente:

1. Accede a http://localhost:8081
2. Sistema: PostgreSQL
3. Servidor: postgres
4. Usuario: coronas_user
5. Contraseña: coronas_password
6. Base de datos: coronas_db

## 🔧 Variables de entorno

Copia `.env.example` a `.env` y ajusta según sea necesario:

```bash
cp .env.example .env
```

Las variables de entorno en Docker se configuran en `docker-compose.yml`.

## 📝 Arquitectura

```
┌─────────────────┐
│   Next.js App   │  Puerto 3001
│   (PM2 Manager) │
└────────┬────────┘
         │
         │ DATABASE_URL
         │
┌────────▼────────┐
│   PostgreSQL    │  Puerto 5432
│   (coronas_db)  │
└─────────────────┘
         │
         │ Gestión visual
         │
┌────────▼────────┐
│     Adminer     │  Puerto 8081
└─────────────────┘
```

## 🚨 Troubleshooting

### Error: Puerto 3001 ya en uso

```bash
# Encontrar el proceso
netstat -ano | findstr :3001

# Matar el proceso (Windows)
taskkill /PID <PID> /F

# O cambiar el puerto en docker-compose.yml
ports:
  - "3002:3001"
```

### Error: Docker no está corriendo

Asegúrate de tener Docker Desktop abierto y corriendo.

### Error de migraciones

```bash
# Resetear migraciones
docker-compose exec app npx prisma migrate reset

# O eliminar el volumen y volver a crear
docker-compose down -v
docker-compose up -d --build
```

### Ver logs completos

```bash
docker-compose logs app
```
