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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ChangeTempPasswordDto } from './dto/change-temp-password.dto.js';
import { OnboardingDto } from './dto/onboarding.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateSettingsDto } from './dto/settings.dto.js';
import { CreatePhoneDto, UpdatePhoneDto } from './dto/user-phone.dto.js';
import { CreateCertificationDto, UpdateCertificationDto } from './dto/user-certification.dto.js';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/user-language.dto.js';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/user-document.dto.js';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/user-bank-account.dto.js';
import { CreatePpeDto, UpdatePpeDto } from './dto/user-ppe.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';
import {
  SuccessResponseDto,
  ErrorResponseDto,
  AuthResponseDataDto,
  UserProfileResponseDto,
} from '../../common/dto/swagger-response.dto.js';
import { UploadService } from '../upload/upload.service.js';
import { createMulterConfig } from '../upload/multer.config.js';

/**
 * Controller do módulo de autenticação.
 *
 * @ApiTags('auth') - Agrupa os endpoints na documentação Swagger
 * @Controller('auth') - Prefixo da rota: /api/v1/auth/*
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly uploadService: UploadService,
  ) {}

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
  login(@Body() dto: LoginDto): Promise<{ accessToken: string; user: AuthResponseDataDto['user']; mustChangePassword: boolean; profileComplete: boolean }> {
    return this.authService.login(dto) as Promise<{ accessToken: string; user: AuthResponseDataDto['user']; mustChangePassword: boolean; profileComplete: boolean }>;
  }

  /**
   * POST /api/v1/auth/change-temp-password
   *
   * Troca a senha temporária por uma nova senha definitiva.
   * Endpoint PROTEGIDO (requer token JWT válido).
   * Apenas funciona se o usuário tiver mustChangePassword: true.
   */
  @ApiOperation({
    summary: 'Change temporary password',
    description:
      'Troca a senha temporária (gerada pelo admin) por uma nova senha definitiva. Requer token JWT válido e que o usuário tenha mustChangePassword: true.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Senha trocada com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou não é necessário trocar a senha',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('change-temp-password')
  changeTempPassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangeTempPasswordDto,
  ) {
    return this.authService.changeTemporaryPassword(user.sub, dto.newPassword);
  }

  /**
   * POST /api/v1/auth/onboarding
   *
   * Submete o onboarding obrigatório do usuário.
   * Preenche todos os dados essenciais e marca o perfil como completo.
   * Endpoint PROTEGIDO (requer token JWT válido).
   */
  @ApiOperation({
    summary: 'Submit mandatory onboarding',
    description:
      'Submete todos os dados obrigatórios do onboarding (dados pessoais, passaporte, contato, localização, idiomas, aeroporto preferido, WINDA ID, IRATA). Marca o perfil como completo. Requer token JWT válido.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding completado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou faltando campos obrigatórios',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou usuário não encontrado',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('onboarding')
  submitOnboarding(
    @CurrentUser() user: JwtPayload,
    @Body() dto: OnboardingDto,
  ) {
    return this.authService.submitOnboarding(user.sub, dto);
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
  // SETTINGS ENDPOINT
  // ==========================================================================

  /**
   * GET /api/v1/auth/settings
   *
   * Obtém as preferências do usuário autenticado.
   */
  @ApiOperation({
    summary: 'Get user settings',
    description: 'Retorna as preferências do usuário (idioma, tema, escala).',
  })
  @ApiResponse({ status: 200, description: 'Preferências retornadas com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('settings')
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub).then((profile) => ({
      language: profile.language,
      theme: profile.theme,
      scale: profile.scale,
    }));
  }

  /**
   * PUT /api/v1/auth/settings
   *
   * Atualiza as preferências do usuário autenticado.
   */
  @ApiOperation({
    summary: 'Update user settings',
    description: 'Atualiza idioma, tema e escala da interface.',
  })
  @ApiResponse({ status: 200, description: 'Preferências atualizadas com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Put('settings')
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.authService.updateSettings(user.sub, dto);
  }

  // ==========================================================================
  // AVATAR ENDPOINT
  // ==========================================================================

  @ApiOperation({
    summary: 'Upload user avatar',
    description: 'Faz upload da foto de perfil do usuário autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Avatar atualizado com sucesso' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMulterConfig(
        process.env['UPLOAD_DIR'] || './uploads',
        Number(process.env['MAX_FILE_SIZE']) || 10485760,
        'avatars',
      ),
    ),
  )
  @Post('avatar')
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided. Use "file" field in multipart form.');
    }

    // Processa o upload via UploadService
    const uploadResult = await this.uploadService.processUpload(
      user.sub,
      file,
      'avatars',
    );

    // Atualiza o photoUrl do usuário
    return this.authService.updateAvatar(user.sub, uploadResult.filePath);
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

  // ==========================================================================
  // BANK ACCOUNTS ENDPOINTS
  // ==========================================================================

  @Post('bank-accounts')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  addBankAccount(@CurrentUser() user: JwtPayload, @Body() dto: CreateBankAccountDto) {
    return this.authService.addBankAccount(user.sub, dto);
  }

  @Put('bank-accounts/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  updateBankAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.authService.updateBankAccount(user.sub, id, dto);
  }

  @Delete('bank-accounts/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  removeBankAccount(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.authService.removeBankAccount(user.sub, id);
  }

  // ==========================================================================
  // PPE (EPIs) ENDPOINTS - Equipamentos de Proteção Individual
  // ==========================================================================

  /**
   * POST /api/v1/auth/ppes
   *
   * Adiciona um novo EPI ao usuário autenticado.
   * Endpoint PROTEGIDO (requer token JWT válido).
   */
  @Post('ppes')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add new PPE (EPI) to current user' })
  @ApiResponse({ status: 201, description: 'EPI adicionado com sucesso' })
  addPpe(@CurrentUser() user: JwtPayload, @Body() dto: CreatePpeDto) {
    return this.authService.addPpe(user.sub, dto);
  }

  /**
   * PUT /api/v1/auth/ppes/:id
   *
   * Atualiza um EPI existente do usuário autenticado.
   * Endpoint PROTEGIDO (requer token JWT válido).
   */
  @Put('ppes/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update PPE (EPI) of current user' })
  @ApiResponse({ status: 200, description: 'EPI atualizado com sucesso' })
  @ApiResponse({ status: 401, description: 'EPI não encontrado ou não pertence ao usuário' })
  updatePpe(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePpeDto,
  ) {
    return this.authService.updatePpe(user.sub, id, dto);
  }

  /**
   * DELETE /api/v1/auth/ppes/:id
   *
   * Remove um EPI do usuário autenticado.
   * Endpoint PROTEGIDO (requer token JWT válido).
   */
  @Delete('ppes/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove PPE (EPI) of current user' })
  @ApiResponse({ status: 200, description: 'EPI removido com sucesso' })
  @ApiResponse({ status: 401, description: 'EPI não encontrado ou não pertence ao usuário' })
  removePpe(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.authService.removePpe(user.sub, id);
  }
}
