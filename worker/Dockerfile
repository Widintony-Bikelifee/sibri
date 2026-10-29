# Dockerfile para SIBRI Bus Movement Background Worker en Render
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos de paquetes
COPY package*.json tsconfig.json ./

# Instalar dependencias completas para compilación
RUN npm ci

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript a JavaScript
RUN npm run build

# Etapa final ligera para producción
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# El worker se ejecuta continuamente en segundo plano
CMD ["npm", "start"]
