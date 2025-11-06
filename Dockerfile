FROM node:18-alpine AS deps

# Instalar dependencias del sistema necesarias para pg y bcrypt
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    postgresql-client

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci --only=production && \
    npm install sharp && \
    npm cache clean --force

# ===================================
# STAGE 2: Builder
# ===================================
FROM node:18-alpine AS builder

RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

WORKDIR /app

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Deshabilitar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# Reconstruir módulos nativos para el entorno actual
RUN npm rebuild bcrypt --build-from-source

# Build de Next.js con salida standalone
RUN npm run build

# ===================================
# STAGE 3: Runner (Producción)
# ===================================
FROM node:18-alpine AS runner

WORKDIR /app

# Variables de entorno para producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Instalar solo las dependencias de runtime necesarias
RUN apk add --no-cache \
    libc6-compat \
    postgresql-client \
    curl

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Copiar archivos de build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Crear directorio para logos si no existe
RUN mkdir -p /app/public/logos && \
    chown -R nextjs:nodejs /app/public/logos

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "server.js"]