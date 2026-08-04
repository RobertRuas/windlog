/**
 * ============================================================================
 * FEEDBACK CONTROLLER - Endpoints de Gestão de Feedbacks
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os endpoints HTTP para gerenciar Feedbacks do sistema.
 * Todos os endpoints são protegidos e requerem autenticação JWT.
 *
 * ENDPOINTS:
 * ----------
 * POST   /api/v1/feedbacks          - Cria novo feedback (qualquer usuário)
 * GET    /api/v1/feedbacks          - Lista feedbacks (ADMIN)
 * GET    /api/v1/feedbacks/stats    - Estatísticas (ADMIN)
 * GET    /api/v1/feedbacks/:id      - Busca feedback (ADMIN)
 * PUT    /api/v1/feedbacks/:id      - Atualiza feedback (ADMIN)
 * DELETE /api/v1/feedbacks/:id      - Remove feedback (ADMIN)
 *
 * SEGURANÇA:
 * ----------
 * - Criação: qualquer usuário autenticado
 * - Listagem/Visualização/Atualização/Exclusão: apenas ADMIN
 * ============================================================================
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { FeedbackService } from './feedback.service.js';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { UpdateFeedbackDto } from './dto/update-feedback.dto.js';
import { FeedbackFilterDto } from './dto/feedback-filter.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles, Role } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

/**
 * Controller FeedbackController - Endpoints de Feedbacks.
 *
 * Protegido por JWT — o usuário precisa estar autenticado.
 * Criação: qualquer usuário. Gestão: apenas ADMIN.
 */
@ApiTags('feedbacks')
@ApiBearerAuth()
@Controller('feedbacks')
@UseGuards(AuthGuard('jwt'))
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // =========================================================================
  // CRIAÇÃO - POST /feedbacks (qualquer usuário autenticado)
  // =========================================================================

  /**
   * Cria um novo feedback.
   *
   * Qualquer usuário autenticado pode reportar bugs, sugestões, etc.
   * O feedback entra com status NEW e prioridade MEDIUM.
   *
   * @param dto - Dados para criação (title, description, category, etc.)
   * @param user - Usuário autenticado (vem do JWT)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reportar novo feedback (qualquer usuário)' })
  @ApiResponse({ status: 201, description: 'Feedback criado com sucesso' })
  async create(@Body() dto: CreateFeedbackDto, @CurrentUser() user: JwtPayload) {
    return this.feedbackService.create(dto, user.sub);
  }

  // =========================================================================
  // ESTATÍSTICAS - GET /feedbacks/stats (ADMIN)
  // =========================================================================

  /**
   * Retorna estatísticas dos feedbacks (contagens por status, categoria, etc.).
   *
   * NOTA: Esta rota deve vir ANTES da rota com :id para evitar conflito.
   *
   * @param user - Administrador autenticado
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Estatísticas dos feedbacks (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Estatísticas dos feedbacks' })
  async getStats(@CurrentUser() user: JwtPayload) {
    return this.feedbackService.getStats();
  }

  // =========================================================================
  // LISTAGEM - GET /feedbacks (ADMIN)
  // =========================================================================

  /**
   * Lista feedbacks com paginação e filtros.
   *
   * Apenas ADMIN pode listar todos os feedbacks.
   *
   * @param filter - Filtros de busca (categoria, status, prioridade, search)
   * @param user - Administrador autenticado
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar feedbacks com paginação e filtros (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de feedbacks' })
  async findAll(@Query() filter: FeedbackFilterDto, @CurrentUser() user: JwtPayload) {
    return this.feedbackService.findAll(filter);
  }

  // =========================================================================
  // BUSCA POR ID - GET /feedbacks/:id (ADMIN)
  // =========================================================================

  /**
   * Busca um feedback completo com todas as relações.
   *
   * @param id - ID do feedback
   * @param user - Administrador autenticado
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Buscar feedback por ID (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Feedback encontrado' })
  @ApiResponse({ status: 404, description: 'Feedback não encontrado' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.feedbackService.findById(id);
  }

  // =========================================================================
  // ATUALIZAÇÃO - PUT /feedbacks/:id (ADMIN)
  // =========================================================================

  /**
   * Atualiza um feedback (prioridade, status, notas).
   *
   * @param id - ID do feedback
   * @param dto - Dados para atualização
   * @param user - Administrador autenticado
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar feedback (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Feedback atualizado' })
  @ApiResponse({ status: 404, description: 'Feedback não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.feedbackService.update(id, dto, user.sub);
  }

  // =========================================================================
  // EXCLUSÃO - DELETE /feedbacks/:id (ADMIN)
  // =========================================================================

  /**
   * Remove um feedback (soft delete).
   *
   * @param id - ID do feedback
   * @param user - Administrador autenticado
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remover feedback (soft delete, ADMIN)' })
  @ApiResponse({ status: 200, description: 'Feedback removido' })
  @ApiResponse({ status: 404, description: 'Feedback não encontrado' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.feedbackService.remove(id);
  }
}
