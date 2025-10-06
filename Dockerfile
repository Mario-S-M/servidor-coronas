# Dockerfile para Next.js con PM2
FROM node:20-alpine AS base

# Installar dependencias necesarias
RUN apk add --no-cache libc6-compat wget

# Stage 1: Instalar dependencias
FROM base AS deps
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Stage 2: Build de la aplicación
FROM base AS builder
WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Build de Next.js
RUN npm run build

# Stage 3: Producción con PM2
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Crear usuario no root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Instalar PM2 globalmente
RUN npm install -g pm2

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/ecosystem.config.json ./ecosystem.config.json
COPY --from=builder /app/package.json ./package.json

# Copiar script de entrada
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Crear directorio de logs y cambiar permisos de todo
RUN mkdir -p logs && \
    chown -R nextjs:nodejs /app && \
    chmod -R 755 /app/logs

USER nextjs

EXPOSE 3001

# Iniciar con script de entrada
ENTRYPOINT ["docker-entrypoint.sh"]
