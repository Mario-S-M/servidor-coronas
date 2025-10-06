# 🍓 Guía Rápida para Raspberry Pi / Linux

## 📋 Requisitos

- Docker instalado
- Docker Compose instalado
- Permisos de usuario para Docker

## 🚀 Instalación de Docker (si no lo tienes)

```bash
# Usar el script incluido
chmod +x get-docker.sh
./get-docker.sh

# O manualmente:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# Reiniciar sesión o ejecutar:
newgrp docker

# Instalar Docker Compose
sudo apt-get update
sudo apt-get install docker-compose
```

## 🎯 Despliegue Rápido

### Paso 1: Dar permisos de ejecución

```bash
chmod +x deploy.sh
```

### Paso 2: Ejecutar

```bash
./deploy.sh
```

## 🔧 Comandos Útiles

```bash
# Levantar servicios
docker-compose up -d --build

# Ver logs
docker-compose logs -f app

# Ver estado
docker-compose ps

# Detener
docker-compose down

# Reiniciar solo la app
docker-compose restart app
```

## 🌐 Acceder a los Servicios

Después de ejecutar `./deploy.sh`:

- **Aplicación**: http://localhost:3001
- **Adminer**: http://localhost:8081 (Gestión de BD)
- **PostgreSQL**: localhost:5432

O desde otra máquina en la red local:

- **Aplicación**: http://[IP-RASPBERRY]:3001
- **Adminer**: http://[IP-RASPBERRY]:8081

### Obtener IP de la Raspberry Pi

```bash
hostname -I
# o
ip addr show
```

## 📊 Monitoreo

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f app

# Ver uso de recursos
docker stats

# Ver PM2 dentro del contenedor
docker-compose exec app pm2 list
docker-compose exec app pm2 monit
```

## 🗃️ Base de Datos

```bash
# Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# Poblar con datos de prueba
docker-compose exec app npm run db:seed

# Acceder a PostgreSQL
docker-compose exec postgres psql -U coronas_user -d coronas_db

# Backup
docker-compose exec postgres pg_dump -U coronas_user coronas_db > backup.sql

# Restaurar backup
cat backup.sql | docker-compose exec -T postgres psql -U coronas_user coronas_db
```

## 🔄 Actualización de la App

```bash
# Pull cambios desde git
git pull origin main

# Rebuild
docker-compose up -d --build

# Ver logs
docker-compose logs -f app
```

## 🐛 Troubleshooting

### Error: "P3005 - The database schema is not empty"

Este error ocurre cuando intentas hacer migraciones en una base de datos que ya tiene datos de un despliegue anterior.

**Solución 1 - El script ya lo maneja automáticamente**: 
El `docker-entrypoint.sh` ahora detecta este error y sincroniza automáticamente.

**Solución 2 - Limpiar y empezar desde cero** (¡Esto borrará todos los datos!):

```bash
# Detener y eliminar volúmenes
sudo docker-compose down -v

# Levantar de nuevo
sudo docker-compose up -d --build
```

**Solución 3 - Mantener los datos existentes**:

```bash
# Solo reiniciar la app
sudo docker-compose restart app
```

### Error: "ERESOLVE could not resolve" o conflictos de dependencias

Este error ocurre durante el build de Docker debido a conflictos de versiones de paquetes.

**Solución**: El Dockerfile ya está configurado con `--legacy-peer-deps`. Si aún así falla:

```bash
# Limpiar cache de Docker
docker system prune -a

# Rebuild desde cero
docker-compose build --no-cache
docker-compose up -d
```

### Error: "permission denied"

```bash
# Dar permisos de ejecución
chmod +x deploy.sh

# Verificar que tu usuario esté en el grupo docker
groups

# Si no está, agregarlo:
sudo usermod -aG docker $USER
newgrp docker
```

### Error: "Docker no está corriendo"

```bash
# Iniciar Docker
sudo systemctl start docker

# Habilitar Docker al inicio
sudo systemctl enable docker

# Verificar estado
sudo systemctl status docker
```

### Error: "Puerto en uso"

```bash
# Ver qué usa el puerto 3001
sudo lsof -i :3001

# Matar proceso
sudo kill -9 <PID>
```

### Ver logs de error

```bash
docker-compose logs app | grep -i error
docker-compose logs postgres | grep -i error
```

### Reinicio completo

```bash
# Detener y limpiar todo
docker-compose down -v

# Rebuild desde cero
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

## 💾 Optimización para Raspberry Pi

### Limitar Recursos en docker-compose.yml

Editar `docker-compose.yml` y agregar:

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: "2"
        memory: 1G
      reservations:
        cpus: "0.5"
        memory: 512M
```

### Limpiar Docker regularmente

```bash
# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes sin usar
docker image prune

# Limpieza completa (¡cuidado!)
docker system prune -a
```

## 🔐 Seguridad

### Firewall (UFW)

```bash
# Instalar UFW si no está
sudo apt-get install ufw

# Permitir SSH (¡importante!)
sudo ufw allow ssh

# Permitir puertos de la app
sudo ufw allow 3001/tcp
sudo ufw allow 8081/tcp

# NO permitir PostgreSQL externamente
# sudo ufw deny 5432/tcp

# Habilitar firewall
sudo ufw enable

# Ver estado
sudo ufw status
```

### Acceso desde red local

Si quieres acceder desde otra computadora en tu red:

```bash
# Obtener IP
hostname -I

# Acceder desde otra PC:
# http://192.168.X.X:3001
```

## 📈 Monitoreo del Sistema

```bash
# CPU y Memoria
htop

# Temperatura (Raspberry Pi)
vcgencmd measure_temp

# Espacio en disco
df -h

# Uso de Docker
docker system df
```

## 🔄 Auto-inicio al reiniciar

Los contenedores ya están configurados con `restart: unless-stopped` en docker-compose.yml, por lo que se iniciarán automáticamente después de un reinicio.

Para verificar:

```bash
# Reiniciar Raspberry Pi
sudo reboot

# Después del reinicio, verificar:
docker-compose ps
```

## 📝 Comandos One-Liner

```bash
# Despliegue completo
chmod +x deploy.sh && ./deploy.sh

# Ver estado rápido
docker-compose ps && docker-compose exec app pm2 list

# Logs de error
docker-compose logs app | grep -i error | tail -20

# Reinicio completo
docker-compose down && docker-compose up -d --build

# Backup rápido
docker-compose exec postgres pg_dump -U coronas_user coronas_db > backup_$(date +%Y%m%d).sql
```

## ✅ Checklist Post-Instalación

- [ ] Docker instalado y corriendo
- [ ] Usuario agregado al grupo docker
- [ ] Permisos de ejecución dados a deploy.sh
- [ ] `./deploy.sh` ejecutado exitosamente
- [ ] App accesible en http://localhost:3001
- [ ] Adminer accesible en http://localhost:8081
- [ ] PM2 corriendo: `docker-compose exec app pm2 list`
- [ ] Firewall configurado (opcional)
- [ ] IP local obtenida para acceso remoto

## 🎉 ¡Listo!

Tu servidor Balance Coronas está corriendo en Raspberry Pi con:

- ✅ Docker + Docker Compose
- ✅ PM2 gestionando procesos
- ✅ PostgreSQL persistente
- ✅ Auto-restart configurado
- ✅ Logs disponibles

Para cualquier problema, revisa los logs:

```bash
docker-compose logs -f app
```
