/**
 * ============================================================================
 * SYSTEM LOG CONTROLLER - Controlador de Logs do Sistema
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Controlador REST que expõe endpoints para consultar e gerenciar logs do sistema.
 * Apenas administradores (ADMIN) podem acessar estes endpoints.
 *
 * ENDPOINTS:
 * ----------
 * GET    /api/v1/system-logs          - Lista logs paginados com filtros
 * GET    /api/v1/system-logs/:id      - Retorna um log específico
 * GET    /api/v1/system-logs/stats    - Retorna estatísticas dos logs
 * DELETE /api/v1/system-logs/cleanup  - Remove logs antigos (manutenção)
 *
 * SEGURANÇA:
 * ----------
 * - Todos os endpoints requerem autenticação (JWT)
 * - Todos os endpoints requerem role ADMIN (guarda de roles)
 * ============================================================================
 */

import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SystemLogService } from './system-log.service.js';
import { LogFilterDto, LogAction, LogSeverity } from './dto/system-log.dto.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles, Role } from '../../common/decorators/roles.decorator.js';

/**
 * Controller SystemLogController - Gerencia endpoints de logs do sistema.
 */
@ApiTags('System Logs')
@ApiBearerAuth()
@Controller('api/v1/system-logs')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class SystemLogController {
  constructor(private readonly systemLogService: SystemLogService) {}

  /**
   * GET /api/v1/system-logs
   * Lista logs paginados com filtros.
   */
  @Get()
  @ApiOperation({ summary: 'Listar logs do sistema', description: 'Retorna logs paginados com filtros de busca, ação, severidade, usuário, entidade e período.' })
  @ApiQuery({ name: 'search', required: false, description: 'Busca textual (mensagem, usuário, entidade)' })
  @ApiQuery({ name: 'action', required: false, enum: LogAction, description: 'Filtrar por ação específica' })
  @ApiQuery({ name: 'severity', required: false, enum: LogSeverity, description: 'Filtrar por severidade' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filtrar por ID do usuário' })
  @ApiQuery({ name: 'entity', required: false, description: 'Filtrar por entidade' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final (ISO format)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 50, máx: 200)' })
  @ApiResponse({ status: 200, description: 'Logs retornados com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado (apenas ADMIN)' })
  findAll(@Query() filter: LogFilterDto) {
    return this.systemLogService.findAll(filter);
  }

  /**
   * GET /api/v1/system-logs/stats
   * Retorna estatísticas dos logs.
   */
  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas dos logs', description: 'Retorna contagens por ação, severidade e usuários mais ativos.' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado (apenas ADMIN)' })
  getStats() {
    return this.systemLogService.getStats();
  }

  /**
   * GET /api/v1/system-logs/:id
   * Retorna um log específico por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar log por ID', description: 'Retorna um log específico pelo ID.' })
  @ApiResponse({ status: 200, description: 'Log retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado (apenas ADMIN)' })
  @ApiResponse({ status: 404, description: 'Log não encontrado' })
  findById(@Param('id') id: string) {
    return this.systemLogService.findById(id);
  }

  /**
   * DELETE /api/v1/system-logs/cleanup
   * Remove logs antigos (mais de X dias).
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpar logs antigos', description: 'Remove logs com mais de X dias (padrão: 90 dias).' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Número de dias para manter (padrão: 90)' })
  @ApiResponse({ status: 200, description: 'Logs removidos com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado (apenas ADMIN)' })
  cleanup(@Query('days') days?: number) {
    return this.systemLogService.cleanup(days || 90);
  }
}
