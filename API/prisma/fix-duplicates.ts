/**
 * Script para verificar e corrigir notificações duplicadas.
 */
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function fixDuplicates() {
  console.log('🔍 Verificando notificações duplicadas...\n');

  const notifications = await prisma.notification.findMany({
    orderBy: [{ userId: 'asc' }, { type: 'asc' }, { createdAt: 'asc' }],
  });

  console.log(`📋 Total de notificações: ${notifications.length}\n`);

  // Agrupa por userId + type
  const groups: Record<string, any[]> = {};
  for (const n of notifications) {
    const key = n.userId + '|' + n.type;
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }

  let duplicatesFound = 0;
  let duplicatesRemoved = 0;

  for (const [key, items] of Object.entries(groups)) {
    const [userId, type] = key.split('|');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const name = user ? user.firstName + ' ' + user.lastName : userId;

    if (items.length > 1) {
      duplicatesFound++;
      console.log(`⚠️  DUPLICADO: ${name} - ${type} (${items.length} notificações)`);
      
      // Mantém a mais recente, remove as outras
      const sorted = items.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
      const toKeep = sorted[0];
      const toRemove = sorted.slice(1);

      console.log(`   ✅ Mantendo: ${toKeep.id} (${toKeep.createdAt.toISOString()})`);
      
      for (const n of toRemove) {
        await prisma.notification.delete({ where: { id: n.id } });
        console.log(`   🗑️  Removendo: ${n.id} (${n.createdAt.toISOString()})`);
        duplicatesRemoved++;
      }
    }
  }

  console.log('\n📊 Resumo:');
  console.log(`   ⚠️  Grupos duplicados encontrados: ${duplicatesFound}`);
  console.log(`   🗑️  Notificações removidas: ${duplicatesRemoved}`);
  console.log(`   ✅ Notificações restantes: ${notifications.length - duplicatesRemoved}`);
  console.log('\n✨ Correção concluída!');

  await prisma.$disconnect();
}

fixDuplicates().catch(console.error);
