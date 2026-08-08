# ============================================================================
# DOCKERFILE - Windlog (Frontend + API em um único container)
# ============================================================================
#
# ARQUITETURA:
# ------------
# Container único com:
#   - Nginx (porta 80): serve frontend estático + proxy /api → NestJS
#   - NestJS API (porta 3000 interna): backend da aplicação
#
# BUILD MULTI-STAGE:
# ------------------
# Stage 1 (frontend-builder): npm install + vite build → ficheiros estáticos
# Stage 2 (api-builder):      npm install + prisma generate + nest build
# Stage 3 (production):       Node 20 + Nginx, apenas artefactos necessários
#
# COMO USAR:
# ----------
# docker compose up --build
#
# A aplicação fica disponível em http://localhost
# ============================================================================

# ── STAGE 1: BUILD FRONTEND ──────────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /build

# Copiar apenas package files para aproveitar cache do Docker
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código fonte do frontend
COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY src/ src/
COPY public/ public/

# Build de produção → gera ficheiros estáticos em dist/
RUN npm run build


# ── STAGE 2: BUILD API ───────────────────────────────────────────────────────
FROM node:20-slim AS api-builder

WORKDIR /build

# Copiar package files da API
COPY API/package.json API/package-lock.json ./
RUN npm ci

# Copiar código fonte da API
COPY API/ ./

# Gerar Prisma Client (necessário para o build TypeScript)
RUN npx prisma generate

# Build NestJS → gera ficheiros compilados em dist/
RUN npm run build


# ── STAGE 3: PRODUÇÃO ────────────────────────────────────────────────────────
FROM node:20-slim

# Instalar nginx para servir o frontend e fazer proxy reverso
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Frontend: ficheiros estáticos servidos pelo nginx ──
COPY --from=frontend-builder /build/dist /usr/share/nginx/html

# ── Nginx: configuração customizada ──
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/sites-enabled/default

# ── API: código compilado ──
COPY --from=api-builder /build/dist ./dist

# ── API: Prisma schema + migrations (necessários para migrate deploy) ──
COPY --from=api-builder /build/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=api-builder /build/prisma/migrations ./prisma/migrations
COPY --from=api-builder /build/prisma.config.ts ./prisma.config.ts

# ── API: Prisma Client gerado (runtime) ──
COPY --from=api-builder /build/generated ./generated

# ── API: seed script ──
COPY --from=api-builder /build/prisma/seed.ts ./prisma/seed.ts

# ── API: node_modules completo (inclui deps + devDeps para migrations/seed) ──
COPY --from=api-builder /build/node_modules ./node_modules
COPY --from=api-builder /build/package.json ./package.json

# ── API: tsconfig (necessário para tsconfig-paths no runtime) ──
COPY --from=api-builder /build/tsconfig.json ./tsconfig.json

# ── Entrypoint: script de inicialização ──
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Directory para uploads de ficheiros
RUN mkdir -p /app/uploads

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3000 \
    LISTEN_HOST=127.0.0.1

# Nginx (80) + API interna (3000)
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
