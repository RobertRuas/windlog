#!/bin/bash

# ============================================================================
# DEV STARTUP SCRIPT - Inicia o ambiente de desenvolvimento
# ============================================================================
#
# O QUE ESTE SCRIPT FAZ?
# ----------------------
# 1. Verifica se o PostgreSQL está rodando
# 2. Gera o client Prisma
# 3. Aplica migrations pendentes
# 4. Roda o seed (cria usuários iniciais)
# 5. Inicia o servidor NestJS em modo desenvolvimento
#
# COMO USAR?
# ----------
# ./dev.sh
#
# OU com permissão de execução:
# chmod +x dev.sh && ./dev.sh
#
# ============================================================================

set -e

# Cores para output no terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR/API"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🚀 Windlog API - Dev Startup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# -------------------------------------------------------------------------
# PASSO 1: Verificar se o PostgreSQL está rodando
# -------------------------------------------------------------------------
echo -e "${YELLOW}[1/5] Verificando PostgreSQL...${NC}"

if pg_isready -q 2>/dev/null; then
    echo -e "${GREEN}  ✅ PostgreSQL está rodando${NC}"
else
    echo -e "${YELLOW}  ⚠️  PostgreSQL não detectado. Tentando iniciar...${NC}"
    
    # Tenta iniciar via Homebrew (macOS)
    if command -v brew &> /dev/null; then
        brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
        sleep 3
    fi
    
    # Verifica novamente
    if pg_isready -q 2>/dev/null; then
        echo -e "${GREEN}  ✅ PostgreSQL iniciado com sucesso${NC}"
    else
        echo -e "${RED}  ❌ Erro: PostgreSQL não pôde ser iniciado${NC}"
        echo -e "${YELLOW}  Inicie manualmente com: brew services start postgresql${NC}"
        exit 1
    fi
fi

# -------------------------------------------------------------------------
# PASSO 2: Verificar se o banco de dados existe
# -------------------------------------------------------------------------
echo -e "${YELLOW}[2/5] Verificando banco de dados...${NC}"

cd "$API_DIR"

# Lê DATABASE_URL do .env
if [ -f .env ]; then
    export $(grep DATABASE_URL .env | xargs)
fi

DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*\/\([^?]*\).*|\1|p')

if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${GREEN}  ✅ Banco de dados '$DB_NAME' existe${NC}"
else
    echo -e "${YELLOW}  ⚠️  Banco '$DB_NAME' não existe. Criando...${NC}"
    createdb "$DB_NAME" 2>/dev/null || true
    echo -e "${GREEN}  ✅ Banco de dados criado${NC}"
fi

# -------------------------------------------------------------------------
# PASSO 3: Gerar client Prisma
# -------------------------------------------------------------------------
echo -e "${YELLOW}[3/5] Gerando Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}  ✅ Prisma Client gerado${NC}"

# -------------------------------------------------------------------------
# PASSO 4: Aplicar migrations e seed
# -------------------------------------------------------------------------
echo -e "${YELLOW}[4/5] Aplicando migrations e seed...${NC}"
npx prisma db push --skip-generate 2>/dev/null || npx prisma db push
npx tsx prisma/seed.ts
echo -e "${GREEN}  ✅ Migrations e seed aplicados${NC}"

# -------------------------------------------------------------------------
# PASSO 5: Iniciar o servidor NestJS
# -------------------------------------------------------------------------
echo -e "${YELLOW}[5/5] Iniciando servidor NestJS...${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🎉 Ambiente pronto!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}API:${NC}        http://localhost:3000"
echo -e "  ${GREEN}Swagger:${NC}    http://localhost:3000/api/docs"
echo -e "  ${GREEN}Prisma Studio:${NC} npx prisma studio"
echo ""
echo -e "  ${YELLOW}Usuários seed:${NC}"
echo -e "    admin@windlog.com   / 123  (ADMIN)"
echo -e "    rh@windlog.com      / 123  (HR)"
echo -e "    default@windlog.com / 123  (STANDARD)"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Inicia o servidor em modo desenvolvimento
npm run start:dev
