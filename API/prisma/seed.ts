/**
 * ============================================================================
 * SEED - População Inicial do Banco de Dados
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Cria dados iniciais no banco de dados para desenvolvimento e testes.
 * Este seed cria o usuário administrador + 10 técnicos padrão (L1/L2).
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
 * 1. admin / 123456 → Role: ADMIN
 * 2-11. technicianN@windlog.com / 123456 → Role: STANDARD (L1 ou L2)
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
 * Senha padrão para todos os usuários de desenvolvimento.
 */
const DEV_PASSWORD = '123456';

/**
 * Dados do usuário administrador a ser criado.
 */
const adminUser = {
  email: 'admin@windlog.com',
  password: DEV_PASSWORD,
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
 * 10 técnicos padrão com informações básicas preenchidas.
 * Níveis IRATA alternados entre L1 e L2.
 * Todos com: dados pessoais, contato, localização, passaporte, idioma e perfil completo.
 */
const technicianUsers = [
  {
    email: 'joao.silva@windlog.com',
    firstName: 'João', lastName: 'Silva',
    phone: '913456701', phoneCountryCode: '+351',
    dateOfBirth: new Date('1992-03-15'), nationality: 'PT',
    address: 'Rua das Flores 42', city: 'Lisboa', postalCode: '1000-001', country: 'PT',
    department: 'Operations', position: 'Wind Turbine Technician', hireDate: new Date('2022-01-10'),
    irataLevel: 'L1', irataNumber: 'IRATA-PT-10201', windaId: 'WINDA001PT',
    preferredAirportCity: 'Lisboa', preferredAirportCountry: 'PT',
    passportNumber: 'PT123456', passportCountry: 'PT',
    language: 'Portuguese',
  },
  {
    email: 'maria.santos@windlog.com',
    firstName: 'Maria', lastName: 'Santos',
    phone: '914567802', phoneCountryCode: '+351',
    dateOfBirth: new Date('1990-07-22'), nationality: 'PT',
    address: 'Av. da Liberdade 110', city: 'Porto', postalCode: '4000-001', country: 'PT',
    department: 'Maintenance', position: 'Wind Turbine Technician', hireDate: new Date('2021-06-01'),
    irataLevel: 'L2', irataNumber: 'IRATA-PT-20302', windaId: 'WINDA002PT',
    preferredAirportCity: 'Porto', preferredAirportCountry: 'PT',
    passportNumber: 'PT234567', passportCountry: 'PT',
    language: 'Portuguese',
  },
  {
    email: 'pierre.dubois@windlog.com',
    firstName: 'Pierre', lastName: 'Dubois',
    phone: '612345601', phoneCountryCode: '+33',
    dateOfBirth: new Date('1988-11-03'), nationality: 'FR',
    address: '12 Rue de la Paix', city: 'Paris', postalCode: '75001', country: 'FR',
    department: 'Operations', position: 'Wind Turbine Technician', hireDate: new Date('2020-09-15'),
    irataLevel: 'L2', irataNumber: 'IRATA-FR-30401', windaId: 'WINDA003FR',
    preferredAirportCity: 'Paris', preferredAirportCountry: 'FR',
    passportNumber: 'FR345678', passportCountry: 'FR',
    language: 'French',
  },
  {
    email: 'anna.mueller@windlog.com',
    firstName: 'Anna', lastName: 'Müller',
    phone: '1712345601', phoneCountryCode: '+49',
    dateOfBirth: new Date('1994-05-18'), nationality: 'DE',
    address: 'Hauptstraße 45', city: 'Hamburg', postalCode: '20095', country: 'DE',
    department: 'Maintenance', position: 'Wind Turbine Technician', hireDate: new Date('2023-02-20'),
    irataLevel: 'L1', irataNumber: 'IRATA-DE-40501', windaId: 'WINDA004DE',
    preferredAirportCity: 'Hamburg', preferredAirportCountry: 'DE',
    passportNumber: 'DE456789', passportCountry: 'DE',
    language: 'German',
  },
  {
    email: 'carlos.garcia@windlog.com',
    firstName: 'Carlos', lastName: 'García',
    phone: '623456702', phoneCountryCode: '+34',
    dateOfBirth: new Date('1991-01-28'), nationality: 'ES',
    address: 'Calle Mayor 78', city: 'Madrid', postalCode: '28001', country: 'ES',
    department: 'Operations', position: 'Wind Turbine Technician', hireDate: new Date('2021-11-05'),
    irataLevel: 'L1', irataNumber: 'IRATA-ES-50601', windaId: 'WINDA005ES',
    preferredAirportCity: 'Madrid', preferredAirportCountry: 'ES',
    passportNumber: 'ES567890', passportCountry: 'ES',
    language: 'Spanish',
  },
  {
    email: 'lars.eriksson@windlog.com',
    firstName: 'Lars', lastName: 'Eriksson',
    phone: '712345601', phoneCountryCode: '+46',
    dateOfBirth: new Date('1989-09-10'), nationality: 'SE',
    address: 'Storgatan 15', city: 'Stockholm', postalCode: '11122', country: 'SE',
    department: 'Maintenance', position: 'Wind Turbine Technician', hireDate: new Date('2020-04-12'),
    irataLevel: 'L2', irataNumber: 'IRATA-SE-60701', windaId: 'WINDA006SE',
    preferredAirportCity: 'Stockholm', preferredAirportCountry: 'SE',
    passportNumber: 'SE678901', passportCountry: 'SE',
    language: 'Swedish',
  },
  {
    email: 'lucas.jansen@windlog.com',
    firstName: 'Lucas', lastName: 'Jansen',
    phone: '612345602', phoneCountryCode: '+31',
    dateOfBirth: new Date('1993-12-05'), nationality: 'NL',
    address: 'Keizersgracht 200', city: 'Amsterdam', postalCode: '1015DX', country: 'NL',
    department: 'Operations', position: 'Wind Turbine Technician', hireDate: new Date('2022-08-01'),
    irataLevel: 'L1', irataNumber: 'IRATA-NL-70801', windaId: 'WINDA007NL',
    preferredAirportCity: 'Amsterdam', preferredAirportCountry: 'NL',
    passportNumber: 'NL789012', passportCountry: 'NL',
    language: 'Dutch',
  },
  {
    email: 'sofia.rossi@windlog.com',
    firstName: 'Sofia', lastName: 'Rossi',
    phone: '323456701', phoneCountryCode: '+39',
    dateOfBirth: new Date('1995-04-20'), nationality: 'IT',
    address: 'Via Roma 55', city: 'Milano', postalCode: '20100', country: 'IT',
    department: 'Maintenance', position: 'Wind Turbine Technician', hireDate: new Date('2023-05-15'),
    irataLevel: 'L2', irataNumber: 'IRATA-IT-80901', windaId: 'WINDA008IT',
    preferredAirportCity: 'Milano', preferredAirportCountry: 'IT',
    passportNumber: 'IT890123', passportCountry: 'IT',
    language: 'Italian',
  },
  {
    email: 'jakub.nowak@windlog.com',
    firstName: 'Jakub', lastName: 'Nowak',
    phone: '512345601', phoneCountryCode: '+48',
    dateOfBirth: new Date('1990-08-14'), nationality: 'PL',
    address: 'ul. Marszałkowska 30', city: 'Warsaw', postalCode: '00-001', country: 'PL',
    department: 'Operations', position: 'Wind Turbine Technician', hireDate: new Date('2021-03-22'),
    irataLevel: 'L1', irataNumber: 'IRATA-PL-91001', windaId: 'WINDA009PL',
    preferredAirportCity: 'Warsaw', preferredAirportCountry: 'PL',
    passportNumber: 'PL901234', passportCountry: 'PL',
    language: 'Polish',
  },
  {
    email: 'emilie.larsen@windlog.com',
    firstName: 'Emilie', lastName: 'Larsen',
    phone: '21234567', phoneCountryCode: '+45',
    dateOfBirth: new Date('1992-06-30'), nationality: 'DK',
    address: 'Nyhavn 12', city: 'Copenhagen', postalCode: '1051', country: 'DK',
    department: 'Maintenance', position: 'Wind Turbine Technician', hireDate: new Date('2020-10-08'),
    irataLevel: 'L2', irataNumber: 'IRATA-DK-11101', windaId: 'WINDA010DK',
    preferredAirportCity: 'Copenhagen', preferredAirportCountry: 'DK',
    passportNumber: 'DK012345', passportCountry: 'DK',
    language: 'Danish',
  },
];

/**
 * Função principal do seed.
 * Cria o usuário administrador no banco de dados se ainda não existir.
 */
async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  const hashedPassword = await bcrypt.hash(DEV_PASSWORD, SALT_ROUNDS);

  // ── 1. ADMINISTRADOR ──────────────────────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminUser.email },
  });

  if (existingAdmin) {
    console.log(`⏭️  Admin já existe: ${adminUser.email} - pulando`);
  } else {
    await prisma.user.create({
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
    console.log(`✅ Admin criado: ${adminUser.email}`);
  }

  // ── 2. TÉCNICOS PADRÃO (10 usuários) ──────────────────────────────────
  for (const tech of technicianUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: tech.email },
    });

    if (existing) {
      console.log(`⏭️  Técnico já existe: ${tech.email} - pulando`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: tech.email,
        password: hashedPassword,
        firstName: tech.firstName,
        lastName: tech.lastName,
        role: Role.STANDARD,
        phone: tech.phone,
        phoneCountryCode: tech.phoneCountryCode,
        dateOfBirth: tech.dateOfBirth,
        nationality: tech.nationality,
        address: tech.address,
        city: tech.city,
        postalCode: tech.postalCode,
        country: tech.country,
        department: tech.department,
        position: tech.position,
        hireDate: tech.hireDate,
        windaId: tech.windaId,
        irataLevel: tech.irataLevel,
        irataNumber: tech.irataNumber,
        preferredAirportCity: tech.preferredAirportCity,
        preferredAirportCountry: tech.preferredAirportCountry,
        profileComplete: true,
      },
    });

    // Cria passaporte para o técnico
    await prisma.userDocument.create({
      data: {
        userId: user.id,
        type: 'PASSPORT',
        documentNumber: tech.passportNumber,
        issuingCountry: tech.passportCountry,
        issueDate: new Date('2023-01-15'),
        expiryDate: new Date('2033-01-15'),
      },
    });

    // Cria idioma nativo para o técnico
    await prisma.userLanguage.create({
      data: {
        userId: user.id,
        language: tech.language,
        level: 'NATIVE',
      },
    });

    console.log(`✅ Técnico criado: ${tech.email} (${tech.irataLevel})`);
  }

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Usuários disponíveis (senha: 123456):');
  console.log('   ┌──────────────────────────────────┬──────────┬──────┐');
  console.log('   │ Email                            │ Role     │ IRATA│');
  console.log('   ├──────────────────────────────────┼──────────┼──────┤');
  console.log('   │ admin@windlog.com                │ ADMIN    │  -   │');
  for (const tech of technicianUsers) {
    const emailPadded = tech.email.padEnd(31);
    const irataPadded = tech.irataLevel.padEnd(4);
    console.log(`   │ ${emailPadded} │ STANDARD │ ${irataPadded} │`);
  }
  console.log('   └──────────────────────────────────┴──────────┴──────┘');
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
