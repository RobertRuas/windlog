/**
 * ============================================================================
 * SYSTEM LOG MODULE - Módulo de Logs do Sistema
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Módulo NestJS que organiza todos os componentes do sistema de logs.
 * Registra o service e controller, e os exporta para uso em outros módulos.
 *
 * POR QUE MÓDULOS?
 * ----------------
 * O NestJS usa módulos para organizar o código em unidades coesas.
 * Cada módulo tem uma responsabilidade clara e pode ser importado
 * por outros módulos que precisem registrar ou consultar logs.
 *
 * COMO USAR EM OUTROS MÓDULOS?
 * ----------------------------
 * @Module({
 *   imports: [SystemLogModule],
 *   // ...
 * })
 * export class SomeModule {}
 *
 * Depois, injete o SystemLogService onde precisar:
 * constructor(private readonly logService: SystemLogService) {}
 * ============================================================================
 */

import { Module, Global } from '@nestjs/common';
import { SystemLogController } from './system-log.controller.js';
import { SystemLogService } from './system-log.service.js';
import { PrismaService } from '../../database/prisma.service.js';

/**
 * Módulo SystemLogModule - Gerencia logs do sistema.
 *
 * @Global() - Torna o módulo disponível em toda a aplicação
 * sem precisar importá-lo explicitamente em cada módulo.
 */
@Global()
@Module({
  controllers: [SystemLogController],
  providers: [SystemLogService, PrismaService],
  exports: [SystemLogService],
})
export class SystemLogModule {}
