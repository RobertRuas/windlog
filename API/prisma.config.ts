/**
 * ============================================================================
 * PRISMA CONFIG - Configuração do Prisma CLI (Prisma v7+)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Este arquivo configura o Prisma CLI para a versão 7+.
 * No Prisma v7, a URL do banco de dados NÃO fica mais no schema.prisma.
 * Ela deve ser definida aqui, neste arquivo de configuração.
 *
 * POR QUE MUDOU?
 * --------------
 * O Prisma v7 separou a configuração do CLI (migrations, generate) da
 * configuração do runtime (PrismaClient). Isso traz mais flexibilidade
 * e permite configurar múltiplos ambientes mais facilmente.
 *
 * O QUE ESTE ARQUIVO FAZ?
 * -----------------------
 * 1. Define onde está o schema.prisma
 * 2. Define onde salvar as migrations
 * 3. Define a URL de conexão com o banco (para migrations e generate)
 *
 * IMPORTANTE:
 * -----------
 * Este arquivo é usado APENAS pelo Prisma CLI (npx prisma migrate, etc.)
 * O PrismaClient (código) usa o adapter configurado no PrismaService.
 * ============================================================================
 */

// Importa variáveis de ambiente do arquivo .env
import 'dotenv/config';

// defineConfig é o helper oficial do Prisma para tipar a configuração
// env() lê variáveis de ambiente de forma segura (com validação)
import { defineConfig, env } from 'prisma/config';

/**
 * Configuração exportada usando o helper defineConfig.
 * Garante type-safety na configuração do Prisma CLI.
 */
export default defineConfig({
  // Caminho para o arquivo schema (relative to project root)
  schema: 'prisma/schema.prisma',

  // Configuração de migrations
  migrations: {
    // Onde as migrations serão salvas
    path: 'prisma/migrations',
  },

  // Configuração do datasource (banco de dados)
  // Usado pelo Prisma CLI para rodar migrations
  datasource: {
    url: env('DATABASE_URL'),
  },
});
