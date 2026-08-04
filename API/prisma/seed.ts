/**
 * ============================================================================
 * SEED - População Inicial do Banco de Dados
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Cria dados iniciais no banco de dados para desenvolvimento e testes.
 * Este seed cria apenas o usuário administrador do sistema.
 *
 * COMO USAR?
 * ----------
 * npm run prisma:seed
 *
 * OU manualmente:
 * npx tsx prisma/seed.ts
 *
 * USUÁRIO CRIADO:
 * ----------------
 * 1. admin / 123456 → Role: ADMIN
 *
 * IMPORTANTE:
 * -----------
 * - As senhas são hasheadas com bcrypt (10 rounds)
 * - Este seed é idempotente: se o usuário já existe, não cria duplicado
 * - Use apenas em ambiente de desenvolvimento
 * ============================================================================
 */

import { PrismaClient, Role } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

// Inicializa o client do Prisma com adapter PostgreSQL (Prisma v7)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL not found in .env file');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

/**
 * Número de rounds do bcrypt para hashear as senhas.
 * Deve ser o mesmo usado no auth.service.ts.
 */
const SALT_ROUNDS = 10;

/**
 * Dados do usuário administrador a ser criado.
 */
const adminUser = {
  email: 'admin@windlog.com',
  password: '123456',
  firstName: 'Admin',
  lastName: 'User',
  role: Role.ADMIN,
  phone: '912345678',
  phoneCountryCode: '+351',
  department: 'IT',
  position: 'System Administrator',
  nationality: 'PT',
};

/**
 * Função principal do seed.
 * Cria o usuário administrador no banco de dados se ainda não existir.
 */
async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Verifica se o usuário administrador já existe
  const existingUser = await prisma.user.findUnique({
    where: { email: adminUser.email },
  });

  if (existingUser) {
    console.log(`⏭️  Usuário já existe: ${adminUser.email} - pulando`);
  } else {
    // Criptografa a senha antes de salvar
    const hashedPassword = await bcrypt.hash(adminUser.password, SALT_ROUNDS);

    // Cria o usuário administrador no banco de dados
    const user = await prisma.user.create({
      data: {
        email: adminUser.email,
        password: hashedPassword,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
        phone: adminUser.phone,
        phoneCountryCode: adminUser.phoneCountryCode,
        department: adminUser.department,
        position: adminUser.position,
        nationality: adminUser.nationality,
      },
    });

    console.log(`✅ Usuário criado: ${user.email} (${user.role})`);
  }

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Usuário disponível:');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ Email               │ Senha  │ Role         │');
  console.log('   ├─────────────────────────────────────────────┤');
  console.log('   │ admin@windlog.com   │ 123456 │ ADMIN        │');
  console.log('   └─────────────────────────────────────────────┘');
}

// Executa o seed e trata erros
main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Fecha a conexão com o banco de dados
    await prisma.$disconnect();
  });
