/**
 * ============================================================================
 * NOTIFICATION MODULE - Módulo de Notificações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Módulo NestJS que organiza todos os componentes do sistema de notificações.
 * Registra o service e controller, e os exporta para uso em outros módulos.
 *
 * COMO USAR EM OUTROS MÓDULOS?
 * ----------------------------
 * @Module({
 *   imports: [NotificationsModule],
 *   // ...
 * })
 * export class SomeModule {}
 *
 * Depois, injete o NotificationService onde precisar:
 * constructor(private readonly notificationService: NotificationService) {}
 * ============================================================================
 */

import { Module, Global } from '@nestjs/common';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';
import { PrismaService } from '../../database/prisma.service.js';

/**
 * Módulo NotificationsModule - Gerencia notificações dos usuários.
 *
 * @Global() - Torna o módulo disponível em toda a aplicação
 * sem precisar importá-lo explicitamente em cada módulo.
 */
@Global()
@Module({
  controllers: [NotificationController],
  providers: [NotificationService, PrismaService],
  exports: [NotificationService],
})
export class NotificationsModule {}
