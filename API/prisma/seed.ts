/**
 * ============================================================================
 * SEED - População Inicial do Banco de Dados
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Cria dados iniciais no banco de dados para desenvolvimento e testes.
 * Este seed cria 3 usuários com diferentes níveis de acesso (roles).
 *
 * COMO USAR?
 * ----------
 * npm run prisma:seed
 *
 * OU manualmente:
 * npx tsx prisma/seed.ts
 *
 * USUÁRIOS CRIADOS:
 * -----------------
 * 1. admin / 123456    → Role: ADMIN
 * 2. rh / 123456       → Role: HR (Recursos Humanos)
 * 3. default / 123456  → Role: STANDARD (Padrão)
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
 * Dados dos usuários a serem criados.
 * Cada usuário tem: email, senha (texto puro), nome, sobrenome e role.
 */
const seedUsers = [
  {
    email: 'admin@windlog.com',
    password: '123456',
    firstName: 'Admin',
    lastName: 'User',
    role: Role.ADMIN,
    phone: '+351912345678',
    phoneCountryCode: '+351',
    department: 'IT',
    position: 'System Administrator',
    nationality: 'PT',
  },
  {
    email: 'rh@windlog.com',
    password: '123456',
    firstName: 'Recursos',
    lastName: 'Humanos',
    role: Role.HR,
    phone: '+351923456789',
    phoneCountryCode: '+351',
    department: 'Human Resources',
    position: 'HR Manager',
    nationality: 'PT',
  },
  {
    email: 'default@windlog.com',
    password: '123456',
    firstName: 'Default',
    lastName: 'User',
    role: Role.STANDARD,
    phone: '+351934567890',
    phoneCountryCode: '+351',
    department: 'Operations',
    position: 'Wind Turbine Technician',
    nationality: 'PT',
  },
];

/**
 * Função principal do seed.
 * Cria os usuários no banco de dados se ainda não existirem.
 */
async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Itera sobre cada usuário e cria se não existir
  for (const userData of seedUsers) {
    // Verifica se o usuário já existe pelo email
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`⏭️  Usuário já existe: ${userData.email} - pulando`);
      continue;
    }

    // Criptografa a senha antes de salvar
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Cria o usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        phone: userData.phone,
        phoneCountryCode: userData.phoneCountryCode,
        department: userData.department,
        position: userData.position,
        nationality: userData.nationality,
      },
    });

    console.log(`✅ Usuário criado: ${user.email} (${user.role})`);
  }

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Usuários disponíveis:');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │ Email                  │ Senha │ Role       │');
  console.log('   ├─────────────────────────────────────────────┤');
  console.log('   │ admin@windlog.com      │ 123456 │ ADMIN      │');
  console.log('   │ rh@windlog.com         │ 123456 │ HR         │');
  console.log('   │ default@windlog.com    │ 123456 │ STANDARD   │');
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
