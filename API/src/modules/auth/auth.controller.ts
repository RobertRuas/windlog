/**
 * ============================================================================
 * AUTH CONTROLLER - Endpoints de Autenticação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os endpoints HTTP para autenticação de usuários.
 * Este controller é PÚBLICO (não requer token JWT para acessar),
 * exceto o endpoint /profile que requer autenticação.
 *
 * ENDPOINTS:
 * ----------
 * POST /api/v1/auth/register  - Registrar novo usuário
 * POST /api/v1/auth/login     - Fazer login
 * GET  /api/v1/auth/profile   - Obter perfil do usuário (requer token)
 * PUT  /api/v1/auth/profile   - Atualizar perfil do usuário (requer token)
 *
 * FLUXO DE AUTENTICAÇÃO:
 * ----------------------
 * 1. Cliente chama POST /register ou /login
 * 2. Servidor valida e retorna { accessToken, user }
 * 3. Cliente armazena o token (localStorage, cookie, etc.)
 * 4. Cliente envia o token em todas as requisições subsequentes:
 *    Authorization: Bearer <accessToken>
 * 5. O JwtAuthGuard valida o token automaticamente
 *
 * SWAGGER:
 * --------
 * Todos os endpoints estão documentados com:
 * - @ApiOperation: resumo do que o endpoint faz
 * - @ApiResponse: respostas possíveis (sucesso e erro)
 * - @ApiBody: corpo da requisição (via DTOs com @ApiProperty)
 * - @ApiBearerAuth: indica que requer token JWT
 * ============================================================================
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { CreatePhoneDto, UpdatePhoneDto } from './dto/user-phone.dto.js';
import { CreateCertificationDto, UpdateCertificationDto } from './dto/user-certification.dto.js';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/user-language.dto.js';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/user-document.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';
import {
  SuccessResponseDto,
  ErrorResponseDto,
  AuthResponseDataDto,
  UserProfileResponseDto,
} from '../../common/dto/swagger-response.dto.js';

/**
 * Controller do módulo de autenticação.
 *
 * @ApiTags('auth') - Agrupa os endpoints na documentação Swagger
 * @Controller('auth') - Prefixo da rota: /api/v1/auth/*
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   *
   * Registra um novo usuário no sistema.
   * Endpoint PÚBLICO (não requer autenticação).
   *
   * FLUXO:
   * 1. Valida os dados recebidos (email único, senha mínima 6 chars)
   * 2. Criptografa a senha com bcrypt
   * 3. Cria o usuário no banco de dados
   * 4. Gera e retorna o token JWT
   */
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Cria uma nova conta de usuário e retorna o token JWT. O e-mail deve ser único.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário registrado com sucesso',
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'E-mail já cadastrado no sistema',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos (ex: e-mail inválido, senha muito curta)',
    type: ErrorResponseDto,
  })
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<{ accessToken: string; user: AuthResponseDataDto['user'] }> {
    return this.authService.register(dto) as Promise<{ accessToken: string; user: AuthResponseDataDto['user'] }>;
  }

  /**
   * POST /api/v1/auth/login
   *
   * Realiza o login do usuário.
   * Endpoint PÚBLICO (não requer autenticação).
   *
   * FLUXO:
   * 1. Busca o usuário pelo e-mail
   * 2. Verifica se o usuário existe e está ativo
   * 3. Compara a senha fornecida com a senha hasheada
   * 4. Gera e retorna o token JWT
   */
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Autentica o usuário com e-mail e senha. Retorna o token JWT que deve ser enviado em requisições protegidas.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login realizado com sucesso',
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Credenciais inválidas (e-mail ou senha incorretos)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    type: ErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<{ accessToken: string; user: AuthResponseDataDto['user'] }> {
    return this.authService.login(dto) as Promise<{ accessToken: string; user: AuthResponseDataDto['user'] }>;
  }

  /**
   * GET /api/v1/auth/profile
   *
   * Obtém o perfil do usuário autenticado.
   * Endpoint PROTEGIDO (requer token JWT válido).
   *
   * FLUXO:
   * 1. O JwtAuthGuard valida o token do header Authorization
   * 2. O @CurrentUser() extrai os dados do usuário do token
   * 3. Busca o perfil completo no banco de dados
   */
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retorna o perfil completo do usuário autenticado, incluindo dados pessoais, profissionais, idiomas, certificações e números de telefone. Requer token JWT válido no header Authorization.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil completo do usuário retornado com sucesso',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido, expirado ou ausente',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  /**
   * PUT /api/v1/auth/profile
   *
   * Atualiza o perfil do usuário autenticado.
   * Endpoint PROTEGIDO (requer token JWT válido).
   *
   * FLUXO:
   * 1. O JwtAuthGuard valida o token do header Authorization
   * 2. O @CurrentUser() extrai os dados do usuário do token
   * 3. Valida os dados enviados
   * 4. Atualiza apenas os campos fornecidos no banco de dados
   * 5. Retorna o perfil atualizado
   */
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Atualiza os dados do perfil do usuário autenticado. Todos os campos são opcionais, permitindo atualizações parciais. Requer token JWT válido no header Authorization.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil atualizado com sucesso',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido, expirado ou ausente',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.sub, dto);
  }

  // ==========================================================================
  // PHONE NUMBERS ENDPOINTS
  // ==========================================================================

  @Post('phones')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  addPhone(@CurrentUser() user: JwtPayload, @Body() dto: CreatePhoneDto) {
    return this.authService.addPhone(user.sub, dto);
  }

  @Put('phones/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  updatePhone(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePhoneDto,
  ) {
    return this.authService.updatePhone(user.sub, id, dto);
  }

  @Delete('phones/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  removePhone(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.authService.removePhone(user.sub, id);
  }

  // ==========================================================================
  // CERTIFICATIONS ENDPOINTS
  // ==========================================================================

  @Post('certifications')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  addCertification(@CurrentUser() user: JwtPayload, @Body() dto: CreateCertificationDto) {
    return this.authService.addCertification(user.sub, dto);
  }

  @Put('certifications/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  updateCertification(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCertificationDto,
  ) {
    return this.authService.updateCertification(user.sub, id, dto);
  }

  @Delete('certifications/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  removeCertification(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.authService.removeCertification(user.sub, id);
  }

  // ==========================================================================
  // LANGUAGES ENDPOINTS
  // ==========================================================================

  @Post('languages')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  addLanguage(@CurrentUser() user: JwtPayload, @Body() dto: CreateLanguageDto) {
    return this.authService.addLanguage(user.sub, dto);
  }

  @Put('languages/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  updateLanguage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLanguageDto,
  ) {
    return this.authService.updateLanguage(user.sub, id, dto);
  }

  @Delete('languages/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  removeLanguage(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.authService.removeLanguage(user.sub, id);
  }

  // ==========================================================================
  // DOCUMENTS ENDPOINTS
  // ==========================================================================

  @Post('documents')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  addDocument(@CurrentUser() user: JwtPayload, @Body() dto: CreateDocumentDto) {
    return this.authService.addDocument(user.sub, dto);
  }

  @Put('documents/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  updateDocument(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.authService.updateDocument(user.sub, id, dto);
  }

  @Delete('documents/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  removeDocument(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.authService.removeDocument(user.sub, id);
  }
}
