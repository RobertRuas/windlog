/**
 * ============================================================================
 * AUTH CONTROLLER - Endpoints de Autenticação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os endpoints HTTP para autenticação de usuários.
 * Este controller é PÚBLICO (não requer token JWT para acessar).
 *
 * ENDPOINTS:
 * ----------
 * POST /api/v1/auth/register  - Registrar novo usuário
 * POST /api/v1/auth/login     - Fazer login
 * GET  /api/v1/auth/profile   - Obter perfil do usuário (requer token)
 *
 * FLUXO DE AUTENTICAÇÃO:
 * ----------------------
 * 1. Cliente chama POST /register ou /login
 * 2. Servidor valida e retorna { accessToken, user }
 * 3. Cliente armazena o token (localStorage, cookie, etc.)
 * 4. Cliente envia o token em todas as requisições subsequentes:
 *    Authorization: Bearer <accessToken>
 * 5. O JwtAuthGuard valida o token automaticamente
 * ============================================================================
 */

import {
  Controller,
  Post,
  Get,
  Body,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

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
   * @param dto - Dados do registro (email, password, firstName, lastName)
   * @returns Token JWT e dados do usuário criado
   */
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already registered',
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/v1/auth/login
   *
   * Realiza o login do usuário.
   * Endpoint PÚBLICO (não requer autenticação).
   *
   * @HttpCode(200) - Retorna 200 (não 201, pois não cria recurso)
   * @param dto - Dados do login (email, password)
   * @returns Token JWT e dados do usuário autenticado
   */
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * GET /api/v1/auth/profile
   *
   * Obtém o perfil do usuário autenticado.
   * Endpoint PROTEGIDO (requer token JWT válido).
   *
   * @UseGuards(AuthGuard('jwt')) - Protege o endpoint com JWT
   * @ApiBearerAuth() - Documenta no Swagger que requer Bearer token
   * @param user - Dados do usuário extraídos do JWT (via @CurrentUser)
   * @returns Perfil completo do usuário
   */
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing token',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }
}
