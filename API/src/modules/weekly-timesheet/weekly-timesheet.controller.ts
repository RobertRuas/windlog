/**
 * ============================================================================
 * WEEKLY TIMESHEET CONTROLLER - Endpoints de Gestão de Timesheets
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os endpoints HTTP para gerenciar Weekly Timesheets do sistema.
 * Todos os endpoints são protegidos e requerem autenticação JWT.
 *
 * ENDPOINTS:
 * ----------
 * GET    /api/v1/weekly-timesheets                    - Lista timesheets (paginado)
 * GET    /api/v1/weekly-timesheets/:id                - Busca timesheet completo
 * POST   /api/v1/weekly-timesheets                    - Cria novo timesheet
 * PUT    /api/v1/weekly-timesheets/:id                - Atualiza timesheet
 * DELETE /api/v1/weekly-timesheets/:id                - Remove timesheet (soft delete)
 * POST   /api/v1/weekly-timesheets/:id/submit         - Submete timesheet
 * GET    /api/v1/weekly-timesheets/project/:projectId - Timesheets de um projeto
 *
 * SEGURANÇA:
 * ----------
 * - Todos os endpoints requerem autenticação (JWT)
 * - Criação/edição: Team Leader do projeto, HR ou ADMIN
 * - Visualização: qualquer usuário autenticado associado
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
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { WeeklyTimesheetService } from './weekly-timesheet.service.js';
import { CreateTimesheetDto } from './dto/create-timesheet.dto.js';
import { UpdateTimesheetDto } from './dto/update-timesheet.dto.js';
import { TimesheetFilterDto } from './dto/timesheet-filter.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';

/**
 * Controller WeeklyTimesheetController - Endpoints de Weekly Timesheets.
 *
 * Protegido por JWT — o usuário precisa estar autenticado.
 * O controle de permissão (Team Leader/HR/Admin) é feito no service.
 */
@ApiTags('weekly-timesheets')
@ApiBearerAuth()
@Controller('weekly-timesheets')
@UseGuards(AuthGuard('jwt'))
export class WeeklyTimesheetController {
  constructor(private readonly timesheetService: WeeklyTimesheetService) {}

  // =========================================================================
  // LISTAGEM - GET /weekly-timesheets
  // =========================================================================

  /**
   * Lista timesheets com paginação e filtros.
   *
   * Qualquer usuário autenticado pode chamar este endpoint.
   * Usuários STANDARD veem apenas timesheets nos quais estão envolvidos.
   *
   * @param filter - Filtros de busca (projeto, semana, status)
   * @param user - Usuário autenticado (vem do JWT)
   */
  @Get()
  @ApiOperation({ summary: 'Listar timesheets com paginação e filtros' })
  @ApiResponse({ status: 200, description: 'Lista de timesheets' })
  async findAll(@Query() filter: TimesheetFilterDto, @CurrentUser() user: JwtPayload) {
    return this.timesheetService.findAll(filter, user.sub, user.role);
  }

  // =========================================================================
  // BUSCA POR PROJETO - GET /weekly-timesheets/project/:projectId
  // =========================================================================

  /**
   * Lista todos os timesheets de um projeto específico.
   * ADMIN/HR veem tudo; demais veem apenas timesheets associados ao seu nome.
   *
   * NOTA: Esta rota deve vir ANTES da rota com :id para evitar conflito.
   * O NestJS processa rotas na ordem em que são definidas.
   *
   * @param projectId - ID do projeto
   * @param user - Usuário autenticado
   */
  @Get('project/:projectId')
  @ApiOperation({ summary: 'Listar timesheets de um projeto específico' })
  @ApiResponse({ status: 200, description: 'Timesheets do projeto' })
  async findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.timesheetService.findByProject(projectId, user.sub, user.role);
  }

  // =========================================================================
  // BUSCA POR ID - GET /weekly-timesheets/:id
  // =========================================================================

  /**
   * Busca um timesheet completo com todos os dias e entradas.
   * Verifica permissão: apenas ADMIN/HR, criador ou usuário nas entradas.
   *
   * @param id - ID do timesheet
   * @param user - Usuário autenticado
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar timesheet completo por ID' })
  @ApiResponse({ status: 200, description: 'Timesheet com dias e entradas' })
  @ApiResponse({ status: 403, description: 'Sem permissão para visualizar' })
  @ApiResponse({ status: 404, description: 'Timesheet não encontrado' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    // Verifica permissão de visualização
    const canView = await this.timesheetService.canViewTimesheet(
      id,
      user.sub,
      user.role,
    );

    if (!canView) {
      throw new ForbiddenException(
        'You do not have permission to view this timesheet',
      );
    }

    return this.timesheetService.findById(id);
  }

  // =========================================================================
  // CRIAÇÃO - POST /weekly-timesheets
  // =========================================================================

  /**
   * Cria um novo Weekly Timesheet vinculado a um projeto.
   *
   * Os 7 dias da semana são gerados automaticamente.
   * jobScope, client e siteName são preenchidos do projeto.
   *
   * @param dto - Dados para criação (projectId, week, jobNumber, teamNo)
   * @param user - Usuário autenticado (Team Leader, HR ou ADMIN)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo Weekly Timesheet' })
  @ApiResponse({ status: 201, description: 'Timesheet criado com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão (precisa ser Team Leader, HR ou Admin)' })
  @ApiResponse({ status: 409, description: 'Timesheet já existe para esta projeto + semana' })
  async create(@Body() dto: CreateTimesheetDto, @CurrentUser() user: JwtPayload) {
    return this.timesheetService.create(dto, user.sub, user.role);
  }

  // =========================================================================
  // ATUALIZAÇÃO - PUT /weekly-timesheets/:id
  // =========================================================================

  /**
   * Atualiza um timesheet existente (metadata + dias + entradas).
   *
   * Suporta atualização aninhada: envia dias e entradas juntos.
   * Entradas sem ID são criadas, com ID são atualizadas,
   * entradas que não vieram são removidas.
   *
   * @param id - ID do timesheet
   * @param dto - Dados para atualização
   * @param user - Usuário autenticado
   */
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar timesheet (metadata + dias + entradas)' })
  @ApiResponse({ status: 200, description: 'Timesheet atualizado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para editar' })
  @ApiResponse({ status: 404, description: 'Timesheet não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTimesheetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.timesheetService.update(id, dto, user.sub, user.role);
  }

  // =========================================================================
  // SUBMETER - POST /weekly-timesheets/:id/submit
  // =========================================================================

  /**
   * Submete um timesheet (muda status de DRAFT para SUBMITTED).
   *
   * @param id - ID do timesheet
   * @param user - Usuário autenticado
   */
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submeter timesheet para aprovação' })
  @ApiResponse({ status: 200, description: 'Timesheet submetido' })
  @ApiResponse({ status: 400, description: 'Apenas timesheets DRAFT podem ser submetidos' })
  async submit(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.timesheetService.submit(id, user.sub, user.role);
  }

  // =========================================================================
  // EXCLUSÃO - DELETE /weekly-timesheets/:id
  // =========================================================================

  /**
   * Remove um timesheet (soft delete).
   *
   * @param id - ID do timesheet
   * @param user - Usuário autenticado
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Remover timesheet (soft delete)' })
  @ApiResponse({ status: 200, description: 'Timesheet removido' })
  @ApiResponse({ status: 403, description: 'Sem permissão para excluir' })
  @ApiResponse({ status: 404, description: 'Timesheet não encontrado' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.timesheetService.remove(id, user.sub, user.role);
  }
}
