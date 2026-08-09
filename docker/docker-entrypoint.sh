#!/bin/bash
# ============================================================================
# DOCKER ENTRYPOINT - Windlog (Produção)
# ============================================================================
#
# O QUE FAZ?
# ----------
# 1. Aguarda o PostgreSQL externo estar acessível (database.windlog.org:5432)
# 2. Aplica migrations pendentes (prisma migrate deploy)
# 3. Executa seed (cria usuários iniciais se não existirem)
# 4. Inicia nginx em background
# 5. Inicia a API NestJS em foreground (PID 1)
#
# NOTA:
# -----
# O seed é idempotente: se os usuários já existem, não cria duplicados.
# ============================================================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Windlog - Starting production container..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Aguardar PostgreSQL externo estar pronto ─────────────────────────────
echo ""
echo "📦 Aguardando PostgreSQL (database.windlog.org:5432)..."

MAX_RETRIES=30
RETRY_COUNT=0

while ! node -e "
  const net = require('net');
  const [host, port] = process.env.DATABASE_URL.match(/@([^:]+):(\d+)/).slice(1);
  const socket = new net.Socket();
  socket.setTimeout(2000);
  socket.on('connect', () => { socket.destroy(); process.exit(0); });
  socket.on('error', () => { socket.destroy(); process.exit(1); });
  socket.on('timeout', () => { socket.destroy(); process.exit(1); });
  socket.connect(parseInt(port), host);
" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ PostgreSQL não respondeu após $MAX_RETRIES tentativas. Abortando."
    exit 1
  fi
  echo "  ⏳ Aguardando PostgreSQL... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

echo "✅ PostgreSQL pronto!"

# ── 2. Aplicar migrations ────────────────────────────────────────────────────
echo ""
echo "📦 Aplicando migrations..."
npx prisma migrate deploy
echo "✅ Migrations aplicadas"

# ── 3. Executar seed (idempotente) ───────────────────────────────────────────
echo ""
echo "🌱 Executando seed..."
npx tsx prisma/seed.ts || echo "⚠️  Seed falhou (dados podem já existir)"
echo "✅ Seed concluído"

# ── 4. Iniciar nginx (background) ────────────────────────────────────────────
echo ""
echo "🌐 Iniciando nginx..."
nginx
echo "✅ nginx iniciado (porta 80)"

# ── 5. Iniciar API NestJS (foreground) ───────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Windlog pronto!"
echo "  🌐 Frontend:  https://app.windlog.org"
echo "  🔌 API:       https://app.windlog.org/api/v1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# API em foreground para manter o container vivo
exec node -r tsconfig-paths/register dist/src/main.js
