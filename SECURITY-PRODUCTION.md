# 🔒 Configuración de Seguridad para Producción

## ⚠️ IMPORTANTE: Antes de desplegar en producción

### 1. Cambiar credenciales de base de datos

En `docker-compose.yml`, cambiar:

```yaml
environment:
  POSTGRES_DB: tu_base_de_datos_segura
  POSTGRES_USER: tu_usuario_seguro
  POSTGRES_PASSWORD: TuPasswordSeguro123!@#
```

Y actualizar la `DATABASE_URL` en el servicio `app`:

```yaml
DATABASE_URL: postgresql://tu_usuario_seguro:TuPasswordSeguro123!@#@postgres:5432/tu_base_de_datos_segura
```

### 2. Configurar variables de entorno seguras

Crear un archivo `.env` (NO commitearlo):

```bash
POSTGRES_DB=mi_db_produccion
POSTGRES_USER=admin_seguro
POSTGRES_PASSWORD=Password_Muy_Seguro_2024!
DATABASE_URL=postgresql://admin_seguro:Password_Muy_Seguro_2024!@postgres:5432/mi_db_produccion
```

Y modificar `docker-compose.yml` para usarlo:

```yaml
services:
  postgres:
    env_file:
      - .env
```

### 3. Usar secretos de Docker (Recomendado para producción)

```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  postgres:
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
```

### 4. Limitar acceso a puertos

En producción, NO exponer PostgreSQL públicamente. Comentar:

```yaml
# ports:
#   - "5432:5432"  # NO exponer en producción
```

### 5. Configurar firewall

Solo permitir acceso a puerto 3001 (o el que uses):

```bash
# En el servidor
sudo ufw allow 3001/tcp
sudo ufw enable
```

### 6. HTTPS con Reverse Proxy

Usar Nginx o Traefik como reverse proxy con certificados SSL:

```yaml
# Agregar servicio nginx
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
    - ./ssl:/etc/nginx/ssl
```

### 7. Limitar recursos

Agregar límites de recursos en `docker-compose.yml`:

```yaml
app:
  deploy:
    resources:
      limits:
        cpus: "2"
        memory: 2G
      reservations:
        cpus: "1"
        memory: 1G
```

### 8. Backup automático

Configurar backup de la base de datos:

```bash
# Script de backup (backup.sh)
docker-compose exec postgres pg_dump -U coronas_user coronas_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 9. Monitoreo

Agregar servicios de monitoreo:

```yaml
# Prometheus + Grafana
prometheus:
  image: prom/prometheus

grafana:
  image: grafana/grafana
```

### 10. Logs centralizados

Configurar logging driver:

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 📋 Checklist de Seguridad

- [ ] Credenciales de DB cambiadas
- [ ] Variables de entorno en archivo .env (no commiteado)
- [ ] Puerto 5432 no expuesto públicamente
- [ ] Firewall configurado
- [ ] HTTPS configurado
- [ ] Límites de recursos establecidos
- [ ] Backup automatizado configurado
- [ ] Monitoreo activo
- [ ] Logs rotativos configurados
- [ ] Versiones de imágenes especificadas (no usar :latest)

## 🚀 Despliegue en Servidor

```bash
# 1. Clonar repositorio
git clone <tu-repo>
cd balance-coronas

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con credenciales seguras

# 3. Construir y levantar
docker-compose up -d --build

# 4. Verificar logs
docker-compose logs -f

# 5. Ejecutar migraciones (si no se ejecutan automáticamente)
docker-compose exec app npx prisma migrate deploy
```

## 🔍 Verificación

```bash
# Verificar que todo esté corriendo
docker-compose ps

# Verificar salud de los servicios
docker-compose exec app pm2 list
docker-compose exec postgres pg_isready

# Verificar conectividad
curl http://localhost:3001
```
