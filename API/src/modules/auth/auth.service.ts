/**
 * ============================================================================
 * AUTH SERVICE - Serviço de Autenticação e Autorização
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém toda a lógica de negócio relacionada à autenticação:
 * - Login (validar credenciais e gerar token)
 * - Registro (criar novo usuário)
 * - Validação de usuário
 * - Geração de tokens JWT
 *
 * REGRAS DE NEGÓCIO:
 * ------------------
 * - Senhas são criptografadas com bcrypt (hash de 10 rounds)
 * - Tokens JWT contêm: id (sub), email, role
 * - Tokens expiram conforme JWT_EXPIRES_IN
 * - E-mail deve ser único (não pode registrar duplicado)
 * - Login falha se e-mail não existe ou senha está errada
 * ============================================================================
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

/**
 * Número de rounds do bcrypt para hashear senhas.
 * 10 é um bom equilíbrio entre segurança e performance.
 * Quanto maior, mais lento (mas mais seguro).
 */
const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  // Logger para registrar operações de autenticação
  private readonly logger = new Logger(AuthService.name);

  /**
   * Construtor com injeção de dependências.
   *
   * @param prisma - Serviço de acesso ao banco de dados
   * @param jwtService - Serviço do NestJS para gerar/validar tokens JWT
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registra um novo usuário no sistema.
   *
   * PASSO A PASSO:
   * 1. Verifica se o e-mail já está em uso
   * 2. Criptografa a senha com bcrypt
   * 3. Cria o usuário no banco de dados (apenas campos obrigatórios)
   * 4. Gera e retorna o token JWT
   *
   * @param dto - Dados do registro (email, password, firstName, lastName + opcionais)
   * @returns Token JWT e dados do usuário (sem senha)
   * @throws ConflictException se o e-mail já estiver em uso
   */
  async register(dto: RegisterDto) {
    // PASSO 1: Verifica se o e-mail já existe no banco
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // PASSO 2: Criptografa a senha (NUNCA salvar em texto puro!)
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // PASSO 3: Cria o usuário no banco de dados
    // Apenas campos obrigatórios + opcionais enviados no DTO
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        // Campos opcionais (preenchidos posteriormente no perfil)
        phone: dto.phone,
        phoneCountryCode: dto.phoneCountryCode,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        nationality: dto.nationality,
        department: dto.department,
        position: dto.position,
      },
    });

    // Registra a operação no log
    this.logger.log(`New user registered: ${user.email} (${user.id})`);

    // PASSO 4: Gera o token JWT para o novo usuário
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    // Retorna o token e os dados do usuário (sem a senha!)
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Realiza o login do usuário.
   *
   * PASSO A PASSO:
   * 1. Busca o usuário pelo e-mail
   * 2. Verifica se o usuário existe e está ativo
   * 3. Compara a senha fornecida com a senha hasheada
   * 4. Gera e retorna o token JWT
   *
   * @param dto - Dados do login (email, password)
   * @returns Token JWT e dados do usuário (sem senha)
   * @throws UnauthorizedException se as credenciais forem inválidas
   */
  async login(dto: LoginDto) {
    // PASSO 1: Busca o usuário pelo e-mail
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // PASSO 2: Verifica se o usuário existe
    // IMPORTANTE: Mensagem genérica para não revelar se o e-mail existe
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verifica se o usuário está ativo
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // PASSO 3: Compara a senha fornecida com a senha hasheada
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // PASSO 4: Gera o token JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    // Registra a operação no log
    this.logger.log(`User logged in: ${user.email} (${user.id})`);

    // Retorna o token e os dados do usuário (sem a senha!)
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Obtém o perfil do usuário autenticado.
   *
   * @param userId - ID do usuário (extraído do JWT via @CurrentUser('sub'))
   * @returns Dados completos do usuário (sem senha), incluindo certificações
   * @throws UnauthorizedException se o usuário não existir
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      // Inclui os relacionamentos para retornar dados completos
      include: {
        phoneNumbers: true,
        certifications: {
          orderBy: { expiryDate: 'asc' },
        },
        languages: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Retorna os dados do usuário sem a senha
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      phoneCountryCode: user.phoneCountryCode,
      dateOfBirth: user.dateOfBirth,
      nationality: user.nationality,
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country,
      department: user.department,
      position: user.position,
      hireDate: user.hireDate,
      employeeId: user.employeeId,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
      phoneNumbers: user.phoneNumbers,
      certifications: user.certifications,
      languages: user.languages,
    };
  }
}
