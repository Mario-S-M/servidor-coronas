# 🍓 LEEME - Raspberry Pi / Linux

## ⚠️ IMPORTANTE

Si estás en **Linux** o **Raspberry Pi**, **NO uses archivos .bat** (son para Windows).

## 🚀 Inicio Rápido

### 1. Instalar Docker (si no lo tienes)

```bash
chmod +x install-docker.sh
./install-docker.sh
```

Después, cierra sesión y vuelve a entrar, o ejecuta:

```bash
newgrp docker
```

### 2. Desplegar la Aplicación

```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Acceder

- **Desde la Raspberry**: http://localhost:3001
- **Desde otra PC**: http://[IP-RASPBERRY]:3001

Para ver la IP:

```bash
hostname -I
```

## 📋 Comandos Esenciales

```bash
# Ver logs
docker-compose logs -f app

# Ver estado
docker-compose ps

# Reiniciar
docker-compose restart app

# Detener
docker-compose down

# PM2 status
docker-compose exec app pm2 list
```

## 🆘 ¿Problemas?

```bash
# Ver ayuda
chmod +x linux-help.sh
./linux-help.sh

# Leer guía completa
cat RASPBERRY-PI-GUIDE.md
```

## 📚 Documentación

- **RASPBERRY-PI-GUIDE.md** - Guía completa para Raspberry Pi
- **QUICK-START.md** - Comandos rápidos
- **DOCKER-DEPLOY.md** - Información de Docker

## 🔧 Troubleshooting Común

### "Permission denied"

```bash
chmod +x deploy.sh
```

### "Docker no está corriendo"

```bash
sudo systemctl start docker
```

### "P3005 - Database schema is not empty"

El script lo maneja automáticamente. Si persiste:

```bash
# Limpiar y reiniciar (¡borra datos!)
chmod +x clean-db.sh
./clean-db.sh
```

### "comando no encontrado" al ejecutar .bat

```bash
# En Linux usa .sh, NO .bat
./deploy.sh  # ✅ Correcto
./deploy.bat # ❌ Incorrecto (es para Windows)
```

## 🌐 Servicios

Después de ejecutar `./deploy.sh`:

- **App**: http://localhost:3001
- **Adminer**: http://localhost:8081
- **PostgreSQL**: localhost:5432

---

**¿Primera vez?** Ejecuta: `chmod +x deploy.sh && ./deploy.sh`
