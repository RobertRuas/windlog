/**
 * ============================================================================
 * PROJECTS CONTROLLER - Endpoints de Gestão de Projetos
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os endpoints HTTP para gerenciar projetos do sistema.
 * Todos os endpoints são protegidos e requerem role ADMIN ou HR.
 *
 * ENDPOINTS:
 * ----------
 * GET    /api/v1/projects                      - Lista todos os projetos (paginado)
 * GET    /api/v1/projects/:id                  - Busca um projeto específico
 * POST   /api/v1/projects                      - Cria novo projeto
 * PUT    /api/v1/projects/:id                  - Atualiza um projeto
 * DELETE /api/v1/projects/:id                  - Remove um projeto (soft delete)
 *
 * ENDPOINTS DE TURBINAS:
 * GET    /api/v1/projects/:id/turbines         - Lista turbinas do projeto
 * POST   /api/v1/projects/:id/turbines         - Adiciona turbina ao projeto
 * PUT    /api/v1/projects/:id/turbines/:tid    - Atualiza turbina
 * DELETE /api/v1/projects/:id/turbines/:tid    - Remove turbina
 *
 * ENDPOINTS DE MEMBROS:
 * GET    /api/v1/projects/:id/members          - Lista membros do projeto
 * POST   /api/v1/projects/:id/members          - Adiciona membro ao projeto
 * DELETE /api/v1/projects/:id/members/:mid     - Remove membro
 *
 * SEGURANÇA:
 * ----------
 * - Todos os endpoints requerem autenticação (JWT)
 * - Todos os endpoints requerem role ADMIN ou HR (RolesGuard)
 * ============================================================================
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { ProjectsService } from './projects.service.js';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectFilterDto,
  CreateTurbineDto,
  UpdateTurbineDto,
  AddMemberDto,
  UpdateMemberDto,
} from './dto/projects.dto.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles, Role } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { UploadService } from '../upload/upload.service.js';
import { createMulterConfig } from '../upload/multer.config.js';

/**
 * Controller ProjectsController - Gerencia endpoints de projetos.
 *
 * @ApiTags('projects') - Agrupa os endpoints na documentação Swagger
 * @ApiBearerAuth() - Indica que requer token JWT
 * @Controller('projects') - Prefixo da rota: /api/v1/projects/*
 * @UseGuards(AuthGuard('jwt'), RolesGuard) - Protege todos os endpoints
 * @Roles(Role.ADMIN, Role.HR) - Apenas ADMIN ou HR podem acessar
 */
@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.HR)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly uploadService: UploadService,
  ) {}

  // =========================================================================
  // PROJECT ENDPOINTS
  // =========================================================================

  /**
   * GET /api/v1/projects
   *
   * Lista todos os projetos com paginação e filtros.
   *
   * PARÂMETROS:
   * - search: busca por nome ou cliente
   * - status: filtra por status
   * - page: página atual (padrão: 1)
   * - limit: itens por página (padrão: 10)
   */
  @Get()
  @ApiOperation({
    summary: 'Listar projetos',
    description: 'Retorna todos os projetos paginados com filtros de busca.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por nome ou cliente' })
  @ApiQuery({ name: 'status', required: false, enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'], description: 'Filtrar por status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Projetos retornados com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado (apenas ADMIN ou HR)' })
  findAll(@Query() filter: ProjectFilterDto) {
    return this.projectsService.findAllProjects(filter);
  }

  /**
   * GET /api/v1/projects/:id
   *
   * Busca um projeto específico por ID.
   * Inclui turbinas e membros associados.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar projeto por ID',
    description: 'Retorna os dados completos de um projeto específico, incluindo turbinas e membros.',
  })
  @ApiResponse({ status: 200, description: 'Projeto retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  findById(@Param('id') id: string) {
    return this.projectsService.findProjectById(id);
  }

  /**
   * POST /api/v1/projects
   *
   * Cria um novo projeto no sistema.
   * Apenas as informações básicas são obrigatórias (name, client, location).
   */
  @Post()
  @ApiOperation({
    summary: 'Criar novo projeto',
    description: 'Cria um novo projeto com informações básicas. Outras informações podem ser preenchidas posteriormente.',
  })
  @ApiResponse({ status: 201, description: 'Projeto criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  @ApiResponse({ status: 409, description: 'Nome do projeto já cadastrado' })
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(dto);
  }

  /**
   * PUT /api/v1/projects/:id
   *
   * Atualiza os dados de um projeto existente.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar projeto',
    description: 'Atualiza os dados de um projeto específico. Todos os campos são opcionais.',
  })
  @ApiResponse({ status: 200, description: 'Projeto atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome do projeto já cadastrado' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.updateProject(id, dto);
  }

  /**
   * DELETE /api/v1/projects/:id
   *
   * Remove um projeto (soft delete).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remover projeto',
    description: 'Remove um projeto do sistema (soft delete). O projeto é marcado como deletado mas não é permanentemente removido.',
  })
  @ApiResponse({ status: 200, description: 'Projeto removido com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  remove(@Param('id') id: string) {
    return this.projectsService.removeProject(id);
  }

  // =========================================================================
  // TURBINE ENDPOINTS
  // =========================================================================

  /**
   * GET /api/v1/projects/:id/turbines
   *
   * Lista todas as turbinas de um projeto.
   */
  @Get(':id/turbines')
  @ApiOperation({
    summary: 'Listar turbinas do projeto',
    description: 'Retorna todas as turbinas associadas a um projeto específico.',
  })
  @ApiResponse({ status: 200, description: 'Turbinas retornadas com sucesso' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  findTurbines(@Param('id') id: string) {
    return this.projectsService.findTurbinesByProject(id);
  }

  /**
   * POST /api/v1/projects/:id/turbines
   *
   * Adiciona uma turbina a um projeto.
   */
  @Post(':id/turbines')
  @ApiOperation({
    summary: 'Adicionar turbina ao projeto',
    description: 'Adiciona uma nova turbina a um projeto específico.',
  })
  @ApiResponse({ status: 201, description: 'Turbina criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  createTurbine(@Param('id') id: string, @Body() dto: CreateTurbineDto) {
    return this.projectsService.createTurbine(id, dto);
  }

  /**
   * PUT /api/v1/projects/:id/turbines/:turbineId
   *
   * Atualiza uma turbina de um projeto.
   */
  @Put(':id/turbines/:turbineId')
  @ApiOperation({
    summary: 'Atualizar turbina',
    description: 'Atualiza os dados de uma turbina específica de um projeto.',
  })
  @ApiResponse({ status: 200, description: 'Turbina atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Turbina não encontrada' })
  updateTurbine(
    @Param('id') id: string,
    @Param('turbineId') turbineId: string,
    @Body() dto: UpdateTurbineDto,
  ) {
    return this.projectsService.updateTurbine(id, turbineId, dto);
  }

  /**
   * DELETE /api/v1/projects/:id/turbines/:turbineId
   *
   * Remove uma turbina de um projeto (soft delete).
   */
  @Delete(':id/turbines/:turbineId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remover turbina',
    description: 'Remove uma turbina de um projeto (soft delete).',
  })
  @ApiResponse({ status: 200, description: 'Turbina removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Turbina não encontrada' })
  removeTurbine(
    @Param('id') id: string,
    @Param('turbineId') turbineId: string,
  ) {
    return this.projectsService.removeTurbine(id, turbineId);
  }

  // =========================================================================
  // MEMBER ENDPOINTS
  // =========================================================================

  /**
   * GET /api/v1/projects/:id/members
   *
   * Lista todos os membros de um projeto.
   */
  @Get(':id/members')
  @ApiOperation({
    summary: 'Listar membros do projeto',
    description: 'Retorna todos os usuários associados a um projeto específico.',
  })
  @ApiResponse({ status: 200, description: 'Membros retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  findMembers(@Param('id') id: string) {
    return this.projectsService.findMembersByProject(id);
  }

  /**
   * POST /api/v1/projects/:id/members
   *
   * Adiciona um membro (usuário) a um projeto.
   */
  @Post(':id/members')
  @ApiOperation({
    summary: 'Adicionar membro ao projeto',
    description: 'Associa um usuário a um projeto específico.',
  })
  @ApiResponse({ status: 201, description: 'Membro adicionado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Projeto ou usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Usuário já é membro do projeto' })
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.projectsService.addMember(id, dto);
  }

  /**
   * PATCH /api/v1/projects/:id/members/:memberId
   *
   * Atualiza a função de um membro no projeto.
   */
  @Patch(':id/members/:memberId')
  @ApiOperation({
    summary: 'Atualizar função do membro',
    description: 'Atualiza a função de um membro em um projeto específico.',
  })
  @ApiResponse({ status: 200, description: 'Função atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado' })
  updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.projectsService.updateMember(id, memberId, dto);
  }

  /**
   * DELETE /api/v1/projects/:id/members/:memberId
   *
   * Remove um membro de um projeto.
   */
  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remover membro do projeto',
    description: 'Remove um usuário associado a um projeto específico.',
  })
  @ApiResponse({ status: 200, description: 'Membro removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado' })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.projectsService.removeMember(id, memberId);
  }

  // =========================================================================
  // FILE ENDPOINTS
  // =========================================================================

  /**
   * POST /api/v1/projects/:id/files
   *
   * Faz upload de um ficheiro e associa ao projeto.
   * Usa UploadService para guardar o ficheiro e ProjectsService para registar no DB.
   */
  @Post(':id/files')
  @ApiOperation({
    summary: 'Upload file to project',
    description: 'Faz upload de um ficheiro e associa ao projeto. O ficheiro é guardado em uploads/{userId}/projects/.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        category: { type: 'string', description: 'Categoria opcional (ex: Relatório, Foto)' },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'ID do projeto' })
  @ApiResponse({ status: 201, description: 'Ficheiro enviado e registado com sucesso' })
  @ApiResponse({ status: 400, description: 'Ficheiro inválido ou projeto não encontrado' })
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMulterConfig(
        // NOTA: Em decorators, `this` não está disponível (avaliados em tempo de classe).
        // As variáveis UPLOAD_DIR e MAX_FILE_SIZE são validadas pelo ConfigModule no startup.
        process.env['UPLOAD_DIR'] || './uploads',
        Number(process.env['MAX_FILE_SIZE']) || 10485760,
        'projects',
      ),
    ),
  )
  async uploadFile(
    @CurrentUser() user: JwtPayload,
    @Param('id') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided. Use "file" field in multipart form.');
    }

    // Processa o upload via UploadService
    const uploadResult = await this.uploadService.processUpload(
      user.sub,
      file,
      'projects',
    );

    // Regista o ficheiro no DB associado ao projeto
    return this.projectsService.addFile(projectId, user.sub, {
      filePath: uploadResult.filePath,
      originalName: uploadResult.originalName,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
      category,
    });
  }

  /**
   * GET /api/v1/projects/:id/files
   *
   * Lista todos os ficheiros de um projeto.
   */
  @Get(':id/files')
  @ApiOperation({
    summary: 'Listar ficheiros do projeto',
    description: 'Retorna todos os ficheiros associados a um projeto específico.',
  })
  @ApiResponse({ status: 200, description: 'Ficheiros retornados com sucesso' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  findFiles(@Param('id') id: string) {
    return this.projectsService.findFilesByProject(id);
  }

  /**
   * DELETE /api/v1/projects/:id/files/:fileId
   *
   * Remove um ficheiro de projeto (soft delete no DB + delete físico).
   */
  @Delete(':id/files/:fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remover ficheiro do projeto',
    description: 'Remove um ficheiro de projeto (soft delete no DB e delete físico do disco).',
  })
  @ApiResponse({ status: 200, description: 'Ficheiro removido com sucesso' })
  @ApiResponse({ status: 403, description: 'Não autorizado (só o dono ou ADMIN)' })
  @ApiResponse({ status: 404, description: 'Ficheiro não encontrado' })
  async removeFile(
    @CurrentUser() user: JwtPayload,
    @Param('id') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    // Primeiro, soft delete no DB (valida ownership)
    const file = await this.projectsService.removeFile(
      projectId,
      fileId,
      user.sub,
      user.role,
    );

    // Depois, remove o ficheiro físico do disco
    try {
      await this.uploadService.deleteFile(user.sub, user.role, file.filePath);
    } catch {
      // Se o ficheiro físico já não existe, ignora (soft delete já foi feito)
    }

    return { message: 'File removed successfully' };
  }

}
