/**
 * ============================================================================
 * PROJECTS MODULE - Módulo de Gestão de Projetos
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Módulo NestJS que organiza e registra todos os componentes do módulo
 * de gestão de projetos (controller, service, DTOs).
 *
 * O QUE ESTE MÓDULO FAZ?
 * ----------------------
 * - Registra o ProjectsController e ProjectsService
 * - Exporta o ProjectsService para uso em outros módulos
 * - Garante que apenas ADMIN e HR possam gerenciar projetos
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller.js';
import { ProjectsService } from './projects.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { UploadModule } from '../upload/upload.module.js';

/**
 * Módulo ProjectsModule - Gerencia operações CRUD de projetos.
 *
 * Este módulo é importado no AppModule para disponibilizar os endpoints
 * de gestão de projetos em toda a aplicação.
 */
@Module({
  // Controllers deste módulo
  controllers: [ProjectsController],

  // Serviços deste módulo
  providers: [ProjectsService, PrismaService],

  // Importa UploadModule para permitir upload de ficheiros nos projetos
  imports: [UploadModule],

  // Exporta o serviço para que outros módulos possam usá-lo
  exports: [ProjectsService],
})
export class ProjectsModule {}
