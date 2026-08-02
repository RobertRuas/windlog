/**
 * ============================================================================
 * NOTIFICATION CONTROLLER - Controlador de Notificações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Controlador REST que expõe endpoints para gerir notificações do usuário.
 * Cada usuário só pode acessar suas próprias notificações.
 *
 * ENDPOINTS:
 * ----------
 * GET    /api/v1/notifications           - Lista notificações paginadas
 * GET    /api/v1/notifications/unread    - Contagem de não lidas
 * GET    /api/v1/notifications/:id       - Retorna uma notificação específica
 * PATCH  /api/v1/notifications/:id       - Atualiza notificação (marcar como lida)
 * PATCH  /api/v1/notifications/read-all  - Marca todas como lidas
 * DELETE /api/v1/notifications/:id       - Remove uma notificação
 * DELETE /api/v1/notifications/read      - Remove todas as lidas
 *
 * SEGURANÇA:
 * ----------
 * - Todos os endpoints requerem autenticação (JWT)
 * - Cada usuário só vê suas próprias notificações
 * ============================================================================
 */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service.js';
import {
  NotificationFilterDto,
  UpdateNotificationDto,
  NotificationType,
  NotificationPriority,
} from './dto/notification.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

/**
 * Controller NotificationController - Gerencia endpoints de notificações.
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * GET /api/v1/notifications
   * Lista notificações paginadas do usuário autenticado.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar notificações',
    description: 'Retorna notificações paginadas do usuário autenticado com filtros de busca, tipo, prioridade e estado de leitura.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Busca textual (título, mensagem)' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType, description: 'Filtrar por tipo específico' })
  @ApiQuery({ name: 'priority', required: false, enum: NotificationPriority, description: 'Filtrar por prioridade' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean, description: 'Filtrar por estado de leitura' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Data inicial (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Data final (ISO format)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 20)' })
  @ApiResponse({ status: 200, description: 'Notificações retornadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@CurrentUser() user: any, @Query() filter: NotificationFilterDto) {
    return this.notificationService.findAll(user.sub, filter);
  }

  /**
   * GET /api/v1/notifications/unread
   * Retorna contagem de notificações não lidas.
   */
  @Get('unread')
  @ApiOperation({ summary: 'Contagem de não lidas', description: 'Retorna quantidade de notificações não lidas do usuário.' })
  @ApiResponse({ status: 200, description: 'Contagem retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationService.getUnreadCount(user.sub);
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * Marca todas as notificações como lidas.
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar todas como lidas', description: 'Marca todas as notificações do usuário como lidas.' })
  @ApiResponse({ status: 200, description: 'Notificações marcadas como lidas' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationService.markAllAsRead(user.sub);
  }

  /**
   * GET /api/v1/notifications/:id
   * Retorna uma notificação específica.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar notificação por ID', description: 'Retorna uma notificação específica pelo ID.' })
  @ApiResponse({ status: 200, description: 'Notificação retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationService.findById(id, user.sub);
  }

  /**
   * PATCH /api/v1/notifications/:id
   * Atualiza uma notificação (marcar como lida/não lida).
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar notificação', description: 'Marca uma notificação como lida ou não lida.' })
  @ApiResponse({ status: 200, description: 'Notificação atualizada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() data: UpdateNotificationDto) {
    return this.notificationService.update(id, user.sub, data);
  }

  /**
   * DELETE /api/v1/notifications/:id
   * Remove uma notificação específica.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover notificação', description: 'Remove uma notificação específica.' })
  @ApiResponse({ status: 200, description: 'Notificação removida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationService.delete(id, user.sub);
  }

  /**
   * DELETE /api/v1/notifications/read
   * Remove todas as notificações lidas.
   */
  @Delete('read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover notificações lidas', description: 'Remove todas as notificações já lidas do usuário.' })
  @ApiResponse({ status: 200, description: 'Notificações lidas removidas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  deleteRead(@CurrentUser() user: any) {
    return this.notificationService.deleteRead(user.sub);
  }
}
