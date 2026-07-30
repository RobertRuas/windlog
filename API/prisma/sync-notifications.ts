/**
 * ============================================================================
 * SYNC NOTIFICATIONS - Sincronizar Notificações para Usuários Existentes
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Script para sincronizar notificações de perfil incompleto para todos
 * os usuários existentes no banco de dados.
 *
 * COMO USAR?
 * ----------
 * npx tsx prisma/sync-notifications.ts
 *
 * O QUE FAZ?
 * ----------
 * - Percorre todos os usuários ativos
 * - Verifica se o perfil está completo
 * - Cria notificação PROFILE_INCOMPLETE se o perfil não estiver completo
 * - Remove notificação se o perfil estiver completo
 * ============================================================================
 */

import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Inicializa o client do Prisma com adapter PostgreSQL (Prisma v7)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL not found in .env file');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

/**
 * Campos obrigatórios para considerar o perfil completo.
 */
const REQUIRED_FIELDS = [
  'phone',
  'dateOfBirth',
  'nationality',
  'address',
  'city',
  'postalCode',
  'country',
  'department',
  'position',
  'hireDate',
] as const;

/**
 * Verifica se o perfil do usuário está completo.
 */
function isProfileComplete(user: any): boolean {
  return REQUIRED_FIELDS.every((field) => {
    const value = user[field];
    return value !== null && value !== undefined;
  });
}

/**
 * Sincroniza notificações para todos os usuários.
 */
async function syncNotifications() {
  console.log('🔄 Iniciando sincronização de notificações...\n');

  // Busca todos os usuários ativos
  const users = await prisma.user.findMany({
    where: { isActive: true, deletedAt: null },
  });

  console.log(`📋 Encontrados ${users.length} usuários ativos\n`);

  let created = 0;
  let removed = 0;
  let skipped = 0;

  for (const user of users) {
    const userName = `${user.firstName} ${user.lastName}`;
    const isComplete = isProfileComplete(user);

    // Verifica se já existe notificação de perfil incompleto
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: 'PROFILE_INCOMPLETE',
      },
    });

    if (isComplete) {
      // Perfil completo: remove notificação se existir
      if (existingNotification) {
        await prisma.notification.delete({
          where: { id: existingNotification.id },
        });
        console.log(`✅ ${userName}: Perfil completo - notificação removida`);
        removed++;
      } else {
        console.log(`⏭️  ${userName}: Perfil completo - sem notificação`);
        skipped++;
      }
    } else {
      // Perfil incompleto: cria notificação se não existir
      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            type: 'PROFILE_INCOMPLETE',
            priority: 'MEDIUM',
            title: 'Complete o seu perfil',
            message: `Olá ${user.firstName}! Por favor, complete todos os dados do seu perfil para continuar a utilizar todas as funcionalidades do sistema.`,
            userId: user.id,
            entity: 'User',
            entityId: user.id,
          },
        });
        console.log(`🔔 ${userName}: Notificação criada - perfil incompleto`);
        created++;
      } else {
        console.log(`⏭️  ${userName}: Já tem notificação`);
        skipped++;
      }
    }
  }

  console.log('\n📊 Resumo:');
  console.log(`   ✅ Criadas: ${created}`);
  console.log(`   🗑️  Removidas: ${removed}`);
  console.log(`   ⏭️  Ignoradas: ${skipped}`);
  console.log('\n✨ Sincronização concluída!');
}

// Executa o script
syncNotifications()
  .catch((error) => {
    console.error('❌ Erro ao sincronizar notificações:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
