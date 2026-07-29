/**
 * ============================================================================
 * UPLOAD MODULE - Módulo de Upload de Ficheiros
 * ============================================================================
 *
 * O QUE É ESTE MÓDULO?
 * ---------------------
 * Módulo NestJS que organiza e registra o serviço centralizado de upload.
 * Pode ser importado por outros módulos que precisem fazer upload de ficheiros.
 *
 * O QUE ESTE MÓDULO EXPORTA?
 * --------------------------
 * - UploadService: pode ser injetado em outros módulos para fazer upload
 *
 * COMO USAR EM OUTROS MÓDULOS?
 * ----------------------------
 * @Module({
 *   imports: [UploadModule],
 *   // ...
 * })
 * export class SomeModule {}
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';
import { PrismaService } from '../../database/prisma.service.js';

@Module({
  // Controllers deste módulo
  controllers: [UploadController],

  // Serviços deste módulo
  providers: [UploadService, PrismaService],

  // Exporta o serviço para que outros módulos possam usá-lo
  exports: [UploadService],
})
export class UploadModule {}
