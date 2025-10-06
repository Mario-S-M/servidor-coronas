# 🎯 Guía de Despliegue - Balance Coronas

## ✅ Pre-requisitos Completados

- [x] Dockerfile multi-stage creado
- [x] docker-compose.yml configurado
- [x] PM2 configurado para gestión de procesos
- [x] Next.js en modo standalone
- [x] Migraciones automáticas al inicio
- [x] Health checks implementados
- [x] Scripts de despliegue creados
- [x] Documentación completa

## 🚀 Pasos para Desplegar

### 1. Verificar Requisitos

```powershell
.\check-setup.bat
```

Este script verifica:

- ✅ Docker instalado
- ✅ Docker Compose disponible
- ✅ Docker corriendo
- ✅ Archivos de configuración presentes
- ✅ Puertos disponibles (3001, 5432, 8081)

### 2. Desplegar la Aplicación

**Opción A - Script Automático (Recomendado):**

```powershell
.\deploy.bat
```

**Opción B - Manual:**

```powershell
# Construir y levantar
docker-compose up -d --build

# Ver logs
docker-compose logs -f app
```

### 3. Verificar Despliegue

```powershell
# Verificar que los contenedores estén corriendo
docker-compose ps

# Deberías ver:
# coronas_postgres - Up
# coronas_app      - Up
# coronas_adminer  - Up
```

### 4. Acceder a los Servicios

- **Aplicación**: http://localhost:3001
- **Adminer**: http://localhost:8081
- **PostgreSQL**: localhost:5432

### 5. Verificar PM2

```powershell
docker-compose exec app pm2 list
```

Deberías ver la app `balance-coronas` corriendo.

### 6. Poblar Base de Datos (Opcional)

```powershell
docker-compose exec app npm run db:seed
```

## 📊 Monitoreo

### Ver Logs en Tiempo Real

```powershell
# Logs de la app
docker-compose logs -f app

# Logs de PostgreSQL
docker-compose logs -f postgres

# Todos los logs
docker-compose logs -f
```

### Ver Estado de PM2

```powershell
# Lista de procesos
docker-compose exec app pm2 list

# Monitor en tiempo real
docker-compose exec app pm2 monit

# Logs de PM2
docker-compose exec app pm2 logs
```

### Health Checks

Los servicios tienen health checks automáticos:

```powershell
# Ver estado de salud
docker inspect coronas_app | Select-String -Pattern "Health"
docker inspect coronas_postgres | Select-String -Pattern "Health"
```

## 🔄 Actualización de la Aplicación

### Después de Cambios en el Código

```powershell
# 1. Rebuild solo la app (más rápido)
docker-compose up -d --build app

# 2. Ver logs para verificar
docker-compose logs -f app
```

### Rebuild Completo

```powershell
# Detener todo
docker-compose down

# Rebuild completo
docker-compose up -d --build

# Verificar
docker-compose ps
```

## 🗃️ Gestión de Base de Datos

### Backup

```powershell
# Crear backup
docker-compose exec postgres pg_dump -U coronas_user coronas_db > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
```

### Restaurar Backup

```powershell
# Restaurar desde backup
Get-Content backup_20250105_120000.sql | docker-compose exec -T postgres psql -U coronas_user coronas_db
```

### Acceder a PostgreSQL

```powershell
docker-compose exec postgres psql -U coronas_user -d coronas_db
```

### Usar Adminer (Interfaz Visual)

1. Abrir http://localhost:8081
2. Conectar:
   - Sistema: PostgreSQL
   - Servidor: postgres
   - Usuario: coronas_user
   - Contraseña: coronas_password
   - Base de datos: coronas_db

## 🔧 Comandos Útiles de Prisma

```powershell
# Ver estado de migraciones
docker-compose exec app npx prisma migrate status

# Ejecutar migraciones pendientes
docker-compose exec app npx prisma migrate deploy

# Resetear base de datos (¡Cuidado!)
docker-compose exec app npx prisma migrate reset

# Abrir Prisma Studio
docker-compose exec app npx prisma studio
```

## 🛑 Detener la Aplicación

```powershell
# Detener servicios (mantiene datos)
docker-compose down

# Detener y eliminar volúmenes (limpieza completa)
docker-compose down -v
```

## 🚨 Troubleshooting

### Problema: Puerto 3001 en uso

```powershell
# Encontrar proceso
netstat -ano | findstr :3001

# Matar proceso
taskkill /PID <PID> /F

# O cambiar puerto en docker-compose.yml
```

### Problema: Contenedor no inicia

```powershell
# Ver logs de error
docker-compose logs app

# Ver logs completos
docker-compose logs --tail=100 app
```

### Problema: Error de conexión a base de datos

```powershell
# Verificar que PostgreSQL está corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Problema: Migraciones fallan

```powershell
# Ver status
docker-compose exec app npx prisma migrate status

# Forzar sync
docker-compose exec app npx prisma db push

# Resetear (elimina datos)
docker-compose exec app npx prisma migrate reset
```

### Problema: Build falla

```powershell
# Limpiar cache de Docker
docker-compose down
docker system prune -a

# Rebuild desde cero
docker-compose up -d --build --force-recreate
```

### Problema: PM2 no responde

```powershell
# Acceder al contenedor
docker-compose exec app sh

# Dentro del contenedor:
pm2 list
pm2 restart all
pm2 logs
```

## 📈 Optimización para Producción

### 1. Recursos

Editar `docker-compose.yml`:

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: "2"
        memory: 2G
```

### 2. Replicas con PM2

Editar `ecosystem.config.json`:

```json
{
  "instances": "max",
  "exec_mode": "cluster"
}
```

### 3. Logs Rotativos

```yaml
app:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

## 🔐 Seguridad en Producción

⚠️ **IMPORTANTE**: Antes de desplegar en producción:

1. **Cambiar credenciales de DB** en `docker-compose.yml`
2. **No exponer puerto 5432** públicamente
3. **Configurar HTTPS** con reverse proxy
4. **Implementar firewall**
5. **Configurar backups automáticos**

Ver [SECURITY-PRODUCTION.md](./SECURITY-PRODUCTION.md) para más detalles.

## 📚 Documentación Relacionada

- [README.md](./README.md) - Introducción general
- [DOCKER-DEPLOY.md](./DOCKER-DEPLOY.md) - Guía completa de Docker
- [QUICK-START.md](./QUICK-START.md) - Referencia rápida
- [SECURITY-PRODUCTION.md](./SECURITY-PRODUCTION.md) - Seguridad
- [DOCKER-SETUP-SUMMARY.md](./DOCKER-SETUP-SUMMARY.md) - Resumen técnico

## ✅ Checklist de Despliegue

### Desarrollo Local

- [ ] Docker Desktop instalado y corriendo
- [ ] Puertos 3001, 5432, 8081 libres
- [ ] Ejecutar `.\check-setup.bat`
- [ ] Ejecutar `.\deploy.bat`
- [ ] Verificar http://localhost:3001
- [ ] Poblar datos con seed (opcional)

### Servidor de Producción

- [ ] Servidor con Docker instalado
- [ ] Credenciales de DB cambiadas
- [ ] Variables de entorno configuradas
- [ ] Firewall configurado
- [ ] HTTPS configurado (Nginx/Traefik)
- [ ] Backups automáticos configurados
- [ ] Monitoreo configurado
- [ ] Logs centralizados
- [ ] Recursos limitados apropiadamente
- [ ] Documentar procedimientos

## 🎉 ¡Listo!

Si todo salió bien, deberías tener:

- ✅ App corriendo en http://localhost:3001
- ✅ PostgreSQL con datos persistentes
- ✅ PM2 gestionando el proceso
- ✅ Health checks activos
- ✅ Logs accesibles
- ✅ Reinicio automático en fallos

**¡Tu aplicación está lista para producción!** 🚀
