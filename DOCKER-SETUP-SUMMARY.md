# 📦 Resumen de Configuración Docker + PM2

## ✅ Archivos Creados/Modificados

### Nuevos archivos:

1. **Dockerfile** - Configuración multi-stage para Next.js con PM2
2. **.dockerignore** - Optimiza el build excluyendo archivos innecesarios
3. **docker-entrypoint.sh** - Script de inicio que ejecuta migraciones automáticamente
4. **.env.example** - Template de variables de entorno
5. **.env.production** - Variables para producción
6. **deploy.sh** - Script de despliegue para Linux/Mac
7. **deploy.bat** - Script de despliegue para Windows
8. **DOCKER-DEPLOY.md** - Documentación completa de Docker
9. **QUICK-START.md** - Comandos rápidos de referencia
10. **SECURITY-PRODUCTION.md** - Guía de seguridad para producción
11. **logs/.gitkeep** - Directorio para logs de PM2

### Archivos modificados:

1. **docker-compose.yml** - Agregado servicio de Next.js con healthcheck
2. **next.config.ts** - Activado modo 'standalone' para Docker
3. **ecosystem.config.json** - Actualizado para usar server.js (standalone)
4. **package.json** - Agregados scripts de PM2

## 🚀 Cómo Usar

### Método 1: Script automático (Recomendado)

```powershell
.\deploy.bat
```

### Método 2: Manual

```powershell
docker-compose up -d --build
```

## 📍 Servicios Disponibles

Después de ejecutar `docker-compose up -d`:

- **Aplicación Next.js**: http://localhost:3001
- **Adminer (Gestión DB)**: http://localhost:8081
- **PostgreSQL**: localhost:5432

## 🔧 Características Implementadas

### Docker:

- ✅ Multi-stage build para optimizar tamaño de imagen
- ✅ Modo standalone de Next.js
- ✅ Usuario no-root para seguridad
- ✅ Health checks automáticos
- ✅ Restart automático en caso de fallo
- ✅ Red Docker aislada

### PM2:

- ✅ Gestión de procesos de Node.js
- ✅ Auto-restart en caso de crash
- ✅ Logs estructurados
- ✅ Límite de memoria configurado (1GB)
- ✅ Configuración lista para producción

### Base de Datos:

- ✅ PostgreSQL en contenedor separado
- ✅ Migraciones automáticas al iniciar
- ✅ Volumen persistente para datos
- ✅ Adminer para gestión visual
- ✅ Health check de PostgreSQL

## 📊 Arquitectura del Sistema

```
┌──────────────────────────────────┐
│    Docker Compose Network        │
│                                  │
│  ┌────────────────────────────┐ │
│  │   Next.js App Container    │ │
│  │   - Node.js 20             │ │
│  │   - PM2 Process Manager    │ │
│  │   - Puerto 3001            │ │
│  │   - Auto-restart           │ │
│  │   - Health checks          │ │
│  └────────┬───────────────────┘ │
│           │                      │
│           │ DATABASE_URL         │
│           ▼                      │
│  ┌────────────────────────────┐ │
│  │   PostgreSQL Container     │ │
│  │   - PostgreSQL 15          │ │
│  │   - Puerto 5432            │ │
│  │   - Volumen persistente    │ │
│  │   - Health checks          │ │
│  └────────┬───────────────────┘ │
│           │                      │
│           │ Gestión visual       │
│           ▼                      │
│  ┌────────────────────────────┐ │
│  │   Adminer Container        │ │
│  │   - Puerto 8081            │ │
│  └────────────────────────────┘ │
│                                  │
└──────────────────────────────────┘
```

## 🔍 Comandos Útiles

### Ver logs en tiempo real:

```powershell
docker-compose logs -f app
```

### Ver estado de PM2:

```powershell
docker-compose exec app pm2 list
docker-compose exec app pm2 monit
```

### Ejecutar comandos Prisma:

```powershell
# Migraciones
docker-compose exec app npx prisma migrate deploy

# Seed
docker-compose exec app npm run db:seed

# Studio
docker-compose exec app npx prisma studio
```

### Reiniciar servicios:

```powershell
# Solo la app
docker-compose restart app

# Todo
docker-compose restart
```

### Detener y limpiar:

```powershell
# Detener
docker-compose down

# Detener y eliminar volúmenes (limpieza completa)
docker-compose down -v
```

## ⚠️ Notas Importantes

1. **Primera ejecución**: Las migraciones se ejecutan automáticamente
2. **Logs**: Se guardan en `./logs/` (sincronizado con el host)
3. **Datos persistentes**: La base de datos persiste en un volumen Docker
4. **Puerto 3001**: Asegúrate de que esté libre
5. **Producción**: Lee `SECURITY-PRODUCTION.md` antes de desplegar

## 🐛 Troubleshooting

### Error: Puerto en uso

```powershell
# Encontrar proceso
netstat -ano | findstr :3001

# Matar proceso
taskkill /PID <PID> /F
```

### Error: Docker no responde

```powershell
# Reiniciar Docker Desktop
# O desde PowerShell:
Restart-Service docker
```

### Error en migraciones

```powershell
# Ver logs
docker-compose logs app

# Ejecutar manualmente
docker-compose exec app npx prisma migrate deploy
```

### Reconstruir desde cero

```powershell
docker-compose down -v
docker-compose up -d --build
```

## 📚 Documentación Adicional

- **DOCKER-DEPLOY.md** - Guía completa de Docker
- **QUICK-START.md** - Referencia rápida de comandos
- **SECURITY-PRODUCTION.md** - Mejores prácticas de seguridad

## ✨ Próximos Pasos Recomendados

1. Probar localmente con `.\deploy.bat`
2. Verificar que todo funciona correctamente
3. Leer `SECURITY-PRODUCTION.md` para producción
4. Configurar HTTPS con reverse proxy (Nginx/Traefik)
5. Configurar backups automáticos
6. Implementar monitoreo (Prometheus/Grafana)

---

**¡Listo para producción!** 🚀
