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
 * Importa UploadModule para poder usar UploadService nos endpoints de ficheiros.
 */
@Module({
  imports: [UploadModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
