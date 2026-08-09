/**
 * ============================================================================
 * TRANSLATION MODULE - Módulo de Tradução com IA (PT -> EN)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Módulo NestJS que organiza e registra os componentes do serviço de
 * tradução (controller e service). É um módulo desacoplado e reutilizável:
 * qualquer parte da aplicação pode consumir seus endpoints.
 *
 * O QUE ESTE MÓDULO FAZ?
 * ----------------------
 * - Registra o TranslationController e o TranslationService
 * - Exporta o TranslationService para uso em outros módulos (se necessário)
 * - Não depende de banco de dados (inferência de IA é stateless)
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { TranslationController } from './translation.controller.js';
import { TranslationService } from './translation.service.js';

/**
 * Módulo TranslationModule - Serviço de tradução com IA.
 */
@Module({
  controllers: [TranslationController],
  providers: [TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}
