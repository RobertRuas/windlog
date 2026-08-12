/**
 * ============================================================================
 * DOCUMENTS MODULE - Módulo de Gestão de Documentos Gerados
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Módulo NestJS que organiza e registra todos os componentes do módulo
 * de Documents (controller, service, DTOs).
 *
 * O QUE ESTE MÓDULO FAZ?
 * ----------------------
 * - Registra o DocumentsController e DocumentsService
 * - Exporta o DocumentsService para uso em outros módulos
 * - Gerencia documentos gerados a partir de templates HTML/SVG
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';
import { PrismaService } from '../../database/prisma.service.js';

/**
 * Módulo DocumentsModule - Gerencia operações CRUD de documentos gerados.
 */
@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, PrismaService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
