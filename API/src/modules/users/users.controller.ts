/**
 * ============================================================================
 * USERS CONTROLLER - Endpoints de Gestão de Usuários
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os endpoints HTTP para gerenciar usuários do sistema.
 * Todos os endpoints são protegidos e requerem role ADMIN ou HR.
 *
 * ENDPOINTS:
 * ----------
 * GET    /api/v1/users          - Lista todos os usuários (paginado)
 * GET    /api/v1/users/:id      - Busca um usuário específico
 * POST   /api/v1/users          - Cria novo usuário
 * PUT    /api/v1/users/:id      - Atualiza um usuário
 * DELETE /api/v1/users/:id      - Remove um usuário (soft delete)
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
  ApiQuery,
} from '@nestjs/swagger';

import { UsersService } from './users.service.js';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from './dto/users.dto.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles, Role } from '../../common/decorators/roles.decorator.js';

/**
 * Controller UsersController - Gerencia endpoints de usuários.
 *
 * @ApiTags('users') - Agrupa os endpoints na documentação Swagger
 * @ApiBearerAuth() - Indica que requer token JWT
 * @Controller('users') - Prefixo da rota: /api/v1/users/*
 * @UseGuards(AuthGuard('jwt'), RolesGuard) - Protege todos os endpoints
 * @Roles(Role.ADMIN, Role.HR) - Apenas ADMIN ou HR podem acessar
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.HR)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/v1/users
   *
   * Lista todos os usuários com paginação e filtros.
   *
   * PARÂMETROS:
   * - search: busca por nome ou email
   * - role: filtra por role (ADMIN, HR, STANDARD)
   * - isActive: filtra por status ativo/inativo
   * - page: página atual (padrão: 1)
   * - limit: itens por página (padrão: 10)
   */
  @Get()
  @ApiOperation({
    summary: 'Listar usuários',
    description: 'Retorna todos os usuários paginados com filtros de busca.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por nome ou email' })
  @ApiQuery({ name: 'role', required: false, enum: ['ADMIN', 'HR', 'STANDARD'], description: 'Filtrar por role' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Usuários retornados com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado (apenas ADMIN ou HR)' })
  findAll(@Query() filter: UserFilterDto) {
    return this.usersService.findAll(filter);
  }

  /**
   * GET /api/v1/users/:id
   *
   * Busca um usuário específico por ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna os dados completos de um usuário específico.',
  })
  @ApiResponse({ status: 200, description: 'Usuário retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * POST /api/v1/users
   *
   * Cria um novo usuário no sistema.
   */
  @Post()
  @ApiOperation({
    summary: 'Criar novo usuário',
    description: 'Cria um novo usuário com email, senha e dados básicos.',
  })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
   * PUT /api/v1/users/:id
   *
   * Atualiza os dados de um usuário existente.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar usuário',
    description: 'Atualiza os dados de um usuário específico. Todos os campos são opcionais.',
  })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  /**
   * DELETE /api/v1/users/:id
   *
   * Remove um usuário (soft delete).
   * O usuário é marcado como deletado e desativado.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remover usuário',
    description: 'Remove um usuário do sistema (soft delete). O usuário é desativado mas não é permanentemente removido.',
  })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  /**
   * POST /api/v1/users/:id/reset-password
   *
   * Reseta a senha de um usuário, gerando uma nova senha temporária.
   * O usuário será obrigado a trocar a senha no próximo login.
   */
  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resetar senha do usuário',
    description: 'Gera uma nova senha temporária para o usuário. O usuário será obrigado a trocar a senha no próximo login.',
  })
  @ApiResponse({ status: 200, description: 'Senha resetada com sucesso. Retorna temporaryPassword.' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(id);
  }
}
