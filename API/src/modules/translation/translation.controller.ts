/**
 * ============================================================================
 * TRANSLATION CONTROLLER - Endpoints de Tradução com IA (PT -> EN)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os endpoints HTTP do serviço de tradução. Todos exigem autenticação
 * JWT e possuem rate limiting próprio para evitar abuso (a inferência de IA
 * consome CPU/memória do servidor).
 *
 * ENDPOINTS:
 * ----------
 * POST /api/v1/translation/warmup    -> Aquece o modelo (carrega em memória)
 * POST /api/v1/translation/translate -> Traduz um texto (PT -> EN)
 * POST /api/v1/translation/unload    -> Descarrega o modelo (libera recursos)
 *
 * FLUXO ESPERADO NO FRONTEND:
 * ---------------------------
 * 1. Usuário ABRE um formulário traduzível  -> chama /warmup
 * 2. Usuário digita e pede sugestões         -> chama /translate (com debounce)
 * 3. Usuário SAI do formulário               -> chama /unload
 *
 * SEGURANÇA:
 * ----------
 * - Qualquer usuário autenticado pode usar (recurso interno da aplicação).
 * - Rate limiting por endpoint para proteger os recursos de inferência.
 * ============================================================================
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { TranslationService } from './translation.service.js';
import { TranslateDto } from './dto/translate.dto.js';

/**
 * Controller TranslationController - Endpoints de tradução com IA.
 *
 * Protegido por JWT — o usuário precisa estar autenticado.
 */
@ApiTags('translation')
@ApiBearerAuth()
@Controller('translation')
@UseGuards(AuthGuard('jwt'))
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  // =========================================================================
  // AQUECIMENTO - POST /translation/warmup
  // =========================================================================

  /**
   * Aquece o modelo de tradução, carregando-o em memória.
   *
   * Deve ser chamado quando o usuário abre um formulário com campos
   * traduzíveis, para que a primeira sugestão apareça sem atraso.
   */
  @Post('warmup')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 20 } }) // Máx. 20 aquecimentos/min
  @ApiOperation({ summary: 'Aquecer o modelo de tradução (carregar em memória)' })
  @ApiResponse({ status: 200, description: 'Modelo aquecido/pronto' })
  async warmUp() {
    return this.translationService.warmUp();
  }

  // =========================================================================
  // TRADUÇÃO - POST /translation/translate
  // =========================================================================

  /**
   * Traduz um texto de Português para Inglês.
   *
   * Limite mais elástico (60/min) pois o frontend chama este endpoint com
   * debounce enquanto o usuário digita.
   */
  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 60 } }) // Máx. 60 traduções/min
  @ApiOperation({ summary: 'Traduzir um texto de Português para Inglês' })
  @ApiResponse({ status: 200, description: 'Texto traduzido com sucesso' })
  @ApiResponse({ status: 503, description: 'Serviço de tradução indisponível' })
  async translate(@Body() dto: TranslateDto) {
    return this.translationService.translate(dto.text);
  }

  // =========================================================================
  // DESCARGA - POST /translation/unload
  // =========================================================================

  /**
   * Descarrega o modelo de tradução da memória, liberando os recursos.
   *
   * Deve ser chamado quando o usuário sai do formulário traduzível.
   */
  @Post('unload')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 20 } }) // Máx. 20 descargas/min
  @ApiOperation({ summary: 'Descarregar o modelo de tradução (liberar recursos)' })
  @ApiResponse({ status: 200, description: 'Modelo descarregado' })
  async unload() {
    return this.translationService.unload();
  }
}
