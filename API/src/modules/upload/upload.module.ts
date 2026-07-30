/**
 * ============================================================================
 * UPLOAD MODULE - Módulo de Upload e Gestão de Ficheiros
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Módulo NestJS que organiza e registra todos os componentes do sistema
 * de upload (controller, service, configuração).
 *
 * O QUE ESTE MÓDULO EXPORTA?
 * --------------------------
 * - UploadService: pode ser injetado em outros módulos que precisem
 *   fazer upload de ficheiros ou gerar URLs temporárias
 *
 * COMO USAR EM OUTROS MÓDULOS?
 * ----------------------------
 * @Module({
 *   imports: [UploadModule],
 *   // ...
 * })
 * export class SomeModule {}
 *
 * Depois injete o UploadService:
 * constructor(private uploadService: UploadService) {}
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';

/**
 * Módulo UploadModule — Gerencia uploads e acesso seguro a ficheiros.
 *
 * Este módulo é importado no AppModule para disponibilizar os endpoints
 * de upload e acesso a ficheiros em toda a aplicação.
 */
@Module({
  // Controllers deste módulo
  controllers: [UploadController],

  // Serviços deste módulo
  providers: [UploadService],

  // Exporta o serviço para que outros módulos possam usá-lo
  // (ex: AuthModule para upload de avatar)
  exports: [UploadService],
})
export class UploadModule {}
