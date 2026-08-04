/**
 * ============================================================================
 * FEEDBACK MODULE - Módulo de Gestão de Feedbacks do Sistema
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Módulo NestJS que organiza e registra todos os componentes do módulo
 * de Feedback (controller, service, DTOs).
 *
 * O QUE ESTE MÓDULO FAZ?
 * ----------------------
 * - Registra o FeedbackController e FeedbackService
 * - Exporta o FeedbackService para uso em outros módulos
 * - Gerencia reportes de feedback (bugs, sugestões, inconsistências)
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { UploadModule } from '../upload/upload.module.js';

/**
 * Módulo FeedbackModule - Gerencia operações CRUD de feedbacks.
 */
@Module({
  imports: [UploadModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, PrismaService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
