/**
 * ============================================================================
 * MAIL MODULE - Módulo de Cliente de E-mail Integrado
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Módulo NestJS que organiza e registra todos os componentes do cliente
 * de e-mail integrado (controller, services).
 *
 * O QUE ESTE MÓDULO FAZ?
 * ----------------------
 * - Registra o MailController, MailService e MailSyncService
 * - Suporte completo a IMAP, SMTP e POP3 (servidores pré-definidos)
 * - Sincronização contínua de mensagens (a cada 60s)
 * - Exporta o MailService para uso em outros módulos
 *
 * DEPENDÊNCIAS:
 * -------------
 * - NotificationsModule (@Global) → notificações de novas mensagens
 * - PrismaService → persistência (contas, pastas, mensagens, contatos...)
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { MailController } from './mail.controller.js';
import { MailService } from './mail.service.js';
import { MailSyncService } from './mail-sync.service.js';
import { PrismaService } from '../../database/prisma.service.js';

/**
 * Módulo MailModule - Gerencia o cliente de e-mail integrado.
 */
@Module({
  controllers: [MailController],
  providers: [MailService, MailSyncService, PrismaService],
  exports: [MailService],
})
export class MailModule {}
