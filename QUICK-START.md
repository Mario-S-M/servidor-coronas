# 🚀 Comandos Rápidos Docker

## Para levantar la aplicación completa:

```powershell
docker-compose up -d --build
```

## Para ver los logs en tiempo real:

```powershell
docker-compose logs -f app
```

## Para detener todo:

```powershell
docker-compose down
```

## Para reiniciar solo la app:

```powershell
docker-compose restart app
```

## Para limpiar todo (incluyendo base de datos):

```powershell
docker-compose down -v
```

## Para ejecutar comandos dentro del contenedor:

```powershell
# Acceder al contenedor
docker-compose exec app sh

# Ver estado de PM2
docker-compose exec app pm2 list

# Ver logs de PM2
docker-compose exec app pm2 logs

# Ejecutar migraciones manualmente
docker-compose exec app npx prisma migrate deploy

# Ejecutar seed
docker-compose exec app npm run db:seed
```

## Servicios disponibles después de docker-compose up -d:

- **App Next.js**: http://localhost:3001
- **Adminer**: http://localhost:8081
- **PostgreSQL**: localhost:5432

## Troubleshooting:

Si algo falla, revisa los logs:

```powershell
docker-compose logs app
docker-compose logs postgres
```
