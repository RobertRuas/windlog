/**
 * ============================================================================
 * USERS MODULE - Módulo de Gestão de Usuários
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Módulo NestJS que organiza e registra todos os componentes do módulo
 * de gestão de usuários (controller, service, DTOs).
 *
 * POR QUE MÓDULOS?
 * ----------------
 * O NestJS usa módulos para organizar o código em unidades coesas.
 * Cada módulo tem uma responsabilidade clara e pode ser importado
 * por outros módulos.
 *
 * O QUE ESTE MÓDULO FAZ?
 * ----------------------
 * - Registra o UsersController e UsersService
 * - Exporta o UsersService para uso em outros módulos
 * - Garante que apenas ADMIN e HR possam gerenciar usuários
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { UploadModule } from '../upload/upload.module.js';

/**
 * Módulo UsersModule - Gerencia operações CRUD de usuários.
 *
 * Este módulo é importado no AppModule para disponibilizar os endpoints
 * de gestão de usuários em toda a aplicação.
 */
@Module({
  imports: [UploadModule],

  // Controllers deste módulo
  controllers: [UsersController],

  // Serviços deste módulo
  providers: [UsersService, PrismaService],

  // Exporta o serviço para que outros módulos possam usá-lo
  exports: [UsersService],
})
export class UsersModule {}
