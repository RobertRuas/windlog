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
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../database/prisma.service.js';
import { UploadService } from '../upload/upload.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateSettingsDto } from './dto/settings.dto.js';
import { CreatePhoneDto, UpdatePhoneDto } from './dto/user-phone.dto.js';
import { CreateCertificationDto, UpdateCertificationDto } from './dto/user-certification.dto.js';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/user-language.dto.js';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/user-document.dto.js';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto/user-bank-account.dto.js';
import { CreatePpeDto, UpdatePpeDto } from './dto/user-ppe.dto.js';
import { OnboardingDto } from './dto/onboarding.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';
import { Role } from '../../common/decorators/roles.decorator.js';

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
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
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
        role: Role.STANDARD, // Segurança: registro público SEMPRE cria usuário STANDARD
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
      profileComplete: user.profileComplete,
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
   * 4. Gera e retorna o token JWT + refresh token
   *
   * @param dto - Dados do login (email, password)
   * @param userAgent - User-Agent do browser (para auditoria do refresh token)
   * @param ipAddress - IP do cliente (para auditoria do refresh token)
   * @returns Token JWT, refresh token e dados do usuário (sem senha)
   * @throws UnauthorizedException se as credenciais forem inválidas
   */
  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
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
      profileComplete: user.profileComplete,
    };

    const token = await this.jwtService.signAsync(payload);

    // Gera o refresh token para login persistente.
    // O refresh token é armazenado hasheado no DB e enviado como cookie httpOnly.
    const refreshToken = await this.generateRefreshToken(
      user.id,
      userAgent,
      ipAddress,
    );

    // Registra a operação no log
    this.logger.log(`User logged in: ${user.email} (${user.id})`);

    // Retorna o token, refresh token e dados do usuário (sem a senha!)
    return {
      accessToken: token,
      refreshToken, // Enviado ao controller para definir o cookie httpOnly
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      mustChangePassword: user.mustChangePassword,
      profileComplete: user.profileComplete,
    };
  }

  /**
   * Troca a senha temporária por uma nova senha definitiva.
   *
   * PASSO A PASSO:
   * 1. Busca o usuário pelo ID
   * 2. Verifica se o usuário tem mustChangePassword: true
   * 3. Criptografa a nova senha
   * 4. Atualiza a senha e remove o flag mustChangePassword
   *
   * @param userId - ID do usuário (extraído do JWT)
   * @param newPassword - Nova senha escolhida pelo usuário
   * @returns Usuário atualizado (sem senha)
   */
  async changeTemporaryPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.mustChangePassword) {
      throw new UnauthorizedException('Password change is not required');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    this.logger.log(`Temporary password changed for user: ${user.email} (${user.id})`);

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Submete o onboarding obrigatório do usuário.
   * Preenche todos os dados essenciais e marca o perfil como completo.
   *
   * PASSO A PASSO:
   * 1. Busca o usuário pelo ID
   * 2. Atualiza dados pessoais, contato, localização, aeroporto, profissionais
   * 3. Cria o documento de passaporte
   * 4. Cria os idiomas
   * 5. Marca profileComplete = true
   *
   * @param userId - ID do usuário (extraído do JWT)
   * @param dto - Dados do onboarding (todos obrigatórios)
   * @returns Perfil completo atualizado
   */
  async submitOnboarding(userId: string, dto: OnboardingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Atualiza o usuário com todos os dados do onboarding em uma transação
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Atualiza dados pessoais, contato, localização, aeroporto e profissionais
      // SEGURANÇA: O email NÃO pode ser alterado no onboarding.
      // Apenas o ADMIN pode alterar o email de um usuário.
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          nationality: dto.nationality,
          dateOfBirth: new Date(dto.dateOfBirth),
          // email: NÃO atualizado — somente ADMIN pode alterar
          phoneCountryCode: dto.phoneCountryCode,
          phone: dto.phone,
          address: dto.address,
          city: dto.city,
          postalCode: dto.postalCode,
          country: dto.country,
          preferredAirportCity: dto.preferredAirportCity,
          preferredAirportCountry: dto.preferredAirportCountry,
          windaId: dto.windaId,
          irataLevel: dto.irataLevel,
          irataNumber: dto.irataNumber,
          profileComplete: true,
        },
      });

      // 2. Cria o documento de passaporte
      await tx.userDocument.create({
        data: {
          userId,
          type: 'PASSPORT',
          documentNumber: dto.passportNumber,
          issuingCountry: dto.passportIssuingCountry,
          issueDate: new Date(dto.passportIssueDate),
          expiryDate: new Date(dto.passportExpiryDate),
          filePath: dto.passportFilePath ?? null,
        },
      });

      // 3. Cria o idioma materno (nível NATIVE)
      await tx.userLanguage.create({
        data: {
          userId,
          language: dto.motherTongue,
          level: 'NATIVE',
        },
      });

      return updatedUser;
    });

    this.logger.log(`Onboarding completed for user: ${user.email} (${user.id})`);

    // Gera um novo token JWT com profileComplete: true
    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      profileComplete: true,
    };
    const newToken = await this.jwtService.signAsync(newPayload);

    // Retorna o perfil completo e o novo token
    const profile = await this.getProfile(userId);
    return {
      ...profile,
      accessToken: newToken,
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
        documents: {
          orderBy: { expiryDate: 'asc' },
        },
        bankAccounts: true,
        ppes: {
          orderBy: { nextInspectionDate: 'asc' },
        },
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
      photoUrl: user.photoUrl,
      signatureData: user.signatureData,
      role: user.role,
      profileComplete: user.profileComplete,
      windaId: user.windaId,
      irataLevel: user.irataLevel,
      irataNumber: user.irataNumber,
      preferredAirportCity: user.preferredAirportCity,
      preferredAirportCountry: user.preferredAirportCountry,
      isTeamLeader: user.isTeamLeader,
      // Preferências do usuário
      language: user.language,
      theme: user.theme,
      scale: user.scale,
      createdAt: user.createdAt,
      phoneNumbers: user.phoneNumbers,
      certifications: user.certifications,
      languages: user.languages,
      documents: user.documents,
      bankAccounts: user.bankAccounts,
      ppes: user.ppes,
    };
  }

  /**
   * Atualiza o perfil do usuário autenticado.
   *
   * PASSO A PASSO:
   * 1. Busca o usuário pelo ID
   * 2. Atualiza apenas os campos fornecidos
   * 3. Retorna o perfil atualizado
   *
   * @param userId - ID do usuário (extraído do JWT)
   * @param dto - Dados a serem atualizados (todos opcionais)
   * @returns Perfil atualizado
   * @throws UnauthorizedException se o usuário não existir
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Verifica se o usuário existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Prepara os dados para atualização (apenas campos fornecidos)
    const updateData: Record<string, unknown> = {};

    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.phoneCountryCode !== undefined) updateData.phoneCountryCode = dto.phoneCountryCode;
    if (dto.dateOfBirth !== undefined) updateData.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.nationality !== undefined) updateData.nationality = dto.nationality;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.postalCode !== undefined) updateData.postalCode = dto.postalCode;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.department !== undefined) updateData.department = dto.department;
    if (dto.position !== undefined) updateData.position = dto.position;
    if (dto.hireDate !== undefined) updateData.hireDate = dto.hireDate ? new Date(dto.hireDate) : null;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.photoUrl !== undefined) updateData.photoUrl = dto.photoUrl;

    // ASSINATURA COMO FICHEIRO: Se o usuário enviar uma base64 de assinatura,
    // convertemos para ficheiro e armazenamos no diretório de uploads do usuário.
    // O campo signatureData armazena o caminho do ficheiro (não o base64).
    if (dto.signatureData !== undefined) {
      if (dto.signatureData === null) {
        // Usuário quer remover a assinatura
        updateData.signatureData = null;
      } else if (dto.signatureData.startsWith('data:image/')) {
        // Base64 de imagem → salvar como ficheiro no diretório do usuário
        updateData.signatureData = this.saveSignatureAsFile(
          userId,
          dto.signatureData,
        );
      } else {
        // Já é um caminho de ficheiro ou string inválida
        updateData.signatureData = dto.signatureData;
      }
    }

    // Atualiza o usuário no banco de dados
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        phoneNumbers: true,
        certifications: {
          orderBy: { expiryDate: 'asc' },
        },
        languages: true,
        documents: {
          orderBy: { expiryDate: 'asc' },
        },
        bankAccounts: true,
      },
    });

    // Registra a operação no log
    this.logger.log(`Profile updated for user: ${user.email} (${user.id})`);

    // Retorna o perfil atualizado
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      phoneCountryCode: updatedUser.phoneCountryCode,
      dateOfBirth: updatedUser.dateOfBirth,
      nationality: updatedUser.nationality,
      address: updatedUser.address,
      city: updatedUser.city,
      postalCode: updatedUser.postalCode,
      country: updatedUser.country,
      department: updatedUser.department,
      position: updatedUser.position,
      hireDate: updatedUser.hireDate,
      employeeId: updatedUser.employeeId,
      bio: updatedUser.bio,
      photoUrl: updatedUser.photoUrl,
      role: updatedUser.role,
      profileComplete: updatedUser.profileComplete,
      windaId: updatedUser.windaId,
      irataLevel: updatedUser.irataLevel,
      irataNumber: updatedUser.irataNumber,
      preferredAirportCity: updatedUser.preferredAirportCity,
      preferredAirportCountry: updatedUser.preferredAirportCountry,
      createdAt: updatedUser.createdAt,
      phoneNumbers: updatedUser.phoneNumbers,
      certifications: updatedUser.certifications,
      languages: updatedUser.languages,
      documents: updatedUser.documents,
      bankAccounts: updatedUser.bankAccounts,
    };
  }

  // ==========================================================================
  // SETTINGS - Preferências do Usuário
  // ==========================================================================

  /**
   * Atualiza as preferências do usuário (idioma, tema, escala).
   *
   * @param userId - ID do usuário (extraído do JWT)
   * @param dto - Preferências a atualizar (todas opcionais)
   * @returns Preferências atualizadas
   */
  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.language !== undefined) updateData.language = dto.language;
    if (dto.theme !== undefined) updateData.theme = dto.theme;
    if (dto.scale !== undefined) updateData.scale = dto.scale;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        language: true,
        theme: true,
        scale: true,
      },
    });

    this.logger.log(`Settings updated for user: ${user.email} (${user.id})`);

    return updatedUser;
  }

  // ==========================================================================
  // AVATAR - Gestão da Foto do Perfil
  // ==========================================================================

  /**
   * Atualiza a foto (avatar) do usuário.
   * Armazena o caminho relativo do ficheiro no campo photoUrl.
   *
   * @param userId - ID do usuário
   * @param filePath - Caminho relativo do ficheiro (ex: "userId/avatars/uuid.jpg")
   * @returns photoUrl atualizado
   */
  async updateAvatar(userId: string, filePath: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Limpa o avatar antigo do disco antes de substituir
    if (user.photoUrl && user.photoUrl !== filePath) {
      this.uploadService.cleanupFile(user.photoUrl);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { photoUrl: filePath },
    });

    this.logger.log(`Avatar updated for user: ${user.email} (${user.id})`);

    return { photoUrl: updatedUser.photoUrl };
  }

  // ==========================================================================
  // PHONE NUMBERS - Gerenciamento de Números de Telefone
  // ==========================================================================

  /**
   * Adiciona um novo número de telefone ao usuário.
   */
  async addPhone(userId: string, dto: CreatePhoneDto) {
    const result = await this.prisma.userPhoneNumber.create({
      data: {
        userId,
        countryCode: dto.countryCode,
        number: dto.number,
        type: dto.type,
        isPrimary: dto.isPrimary ?? false,
      },
    });
    return result;
  }

  /**
   * Atualiza um número de telefone existente.
   */
  async updatePhone(userId: string, phoneId: string, dto: UpdatePhoneDto) {
    // Verifica se o número pertence ao usuário
    const phone = await this.prisma.userPhoneNumber.findFirst({
      where: { id: phoneId, userId },
    });

    if (!phone) {
      throw new UnauthorizedException('Phone number not found');
    }

    return this.prisma.userPhoneNumber.update({
      where: { id: phoneId },
      data: dto,
    });
  }

  /**
   * Remove um número de telefone.
   */
  async removePhone(userId: string, phoneId: string) {
    // Verifica se o número pertence ao usuário
    const phone = await this.prisma.userPhoneNumber.findFirst({
      where: { id: phoneId, userId },
    });

    if (!phone) {
      throw new UnauthorizedException('Phone number not found');
    }

    const result = await this.prisma.userPhoneNumber.delete({
      where: { id: phoneId },
    });
    return result;
  }

  // ==========================================================================
  // CERTIFICATIONS - Gerenciamento de Certificações
  // ==========================================================================

  /**
   * Adiciona uma nova certificação ao usuário.
   */
  async addCertification(userId: string, dto: CreateCertificationDto) {
    const result = await this.prisma.userCertification.create({
      data: {
        userId,
        name: dto.name,
        issuer: dto.issuer,
        type: dto.type,
        description: dto.description,
        certNumber: dto.certNumber,
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        // Ficheiro anexado (foto ou PDF da certificação)
        filePath: dto.filePath ?? null,
      },
    });
    return result;
  }

  /**
   * Atualiza uma certificação existente.
   */
  async updateCertification(userId: string, certId: string, dto: UpdateCertificationDto) {
    // Verifica se a certificação pertence ao usuário
    const cert = await this.prisma.userCertification.findFirst({
      where: { id: certId, userId },
    });

    if (!cert) {
      throw new UnauthorizedException('Certification not found');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.issuer !== undefined) updateData.issuer = dto.issuer;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.certNumber !== undefined) updateData.certNumber = dto.certNumber;
    if (dto.issueDate !== undefined) updateData.issueDate = new Date(dto.issueDate);
    if (dto.expiryDate !== undefined) updateData.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    // Se filePath mudou, limpa o ficheiro antigo do disco
    if (dto.filePath !== undefined && dto.filePath !== cert.filePath) {
      this.uploadService.cleanupFile(cert.filePath);
    }
    if (dto.filePath !== undefined) updateData.filePath = dto.filePath || null;

    return this.prisma.userCertification.update({
      where: { id: certId },
      data: updateData,
    });
  }

  /**
   * Remove uma certificação.
   * O ficheiro anexado é removido automaticamente do disco.
   */
  async removeCertification(userId: string, certId: string) {
    // Verifica se a certificação pertence ao usuário
    const cert = await this.prisma.userCertification.findFirst({
      where: { id: certId, userId },
    });

    if (!cert) {
      throw new UnauthorizedException('Certification not found');
    }

    // Limpa o ficheiro anexado do disco (se existir)
    this.uploadService.cleanupFile(cert.filePath);

    const result = await this.prisma.userCertification.delete({
      where: { id: certId },
    });
    return result;
  }

  // ==========================================================================
  // LANGUAGES - Gerenciamento de Idiomas
  // ==========================================================================

  /**
   * Adiciona um novo idioma ao usuário.
   */
  async addLanguage(userId: string, dto: CreateLanguageDto) {
    const result = await this.prisma.userLanguage.create({
      data: {
        userId,
        language: dto.language,
        level: dto.level,
      },
    });
    return result;
  }

  /**
   * Atualiza um idioma existente.
   */
  async updateLanguage(userId: string, languageId: string, dto: UpdateLanguageDto) {
    // Verifica se o idioma pertence ao usuário
    const lang = await this.prisma.userLanguage.findFirst({
      where: { id: languageId, userId },
    });

    if (!lang) {
      throw new UnauthorizedException('Language not found');
    }

    return this.prisma.userLanguage.update({
      where: { id: languageId },
      data: dto,
    });
  }

  /**
   * Remove um idioma.
   */
  async removeLanguage(userId: string, languageId: string) {
    // Verifica se o idioma pertence ao usuário
    const lang = await this.prisma.userLanguage.findFirst({
      where: { id: languageId, userId },
    });

    if (!lang) {
      throw new UnauthorizedException('Language not found');
    }

    const result = await this.prisma.userLanguage.delete({
      where: { id: languageId },
    });
    return result;
  }

  // ==========================================================================
  // DOCUMENTS - Gerenciamento de Documentos Pessoais
  // ==========================================================================

  /**
   * Adiciona um novo documento pessoal ao usuário.
   */
  async addDocument(userId: string, dto: CreateDocumentDto) {
    const result = await this.prisma.userDocument.create({
      data: {
        userId,
        type: dto.type,
        documentNumber: dto.documentNumber,
        issuingCountry: dto.issuingCountry,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        description: dto.description,
        // Ficheiro anexado (foto ou PDF do documento)
        filePath: dto.filePath ?? null,
      },
    });
    return result;
  }

  /**
   * Atualiza um documento existente.
   * Se files for fornecido, substitui todos os ficheiros anexados.
   */
  async updateDocument(userId: string, documentId: string, dto: UpdateDocumentDto) {
    // Verifica se o documento pertence ao usuário
    const doc = await this.prisma.userDocument.findFirst({
      where: { id: documentId, userId },
    });

    if (!doc) {
      throw new UnauthorizedException('Document not found');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.documentNumber !== undefined) updateData.documentNumber = dto.documentNumber;
    if (dto.issuingCountry !== undefined) updateData.issuingCountry = dto.issuingCountry;
    if (dto.issueDate !== undefined) updateData.issueDate = dto.issueDate ? new Date(dto.issueDate) : null;
    if (dto.expiryDate !== undefined) updateData.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    if (dto.description !== undefined) updateData.description = dto.description;
    // Se filePath mudou, limpa o ficheiro antigo do disco
    if (dto.filePath !== undefined && dto.filePath !== doc.filePath) {
      this.uploadService.cleanupFile(doc.filePath);
    }
    if (dto.filePath !== undefined) updateData.filePath = dto.filePath || null;

    return this.prisma.userDocument.update({
      where: { id: documentId },
      data: updateData,
    });
  }

  /**
   * Remove um documento pessoal.
   * O ficheiro anexado é removido automaticamente do disco.
   */
  async removeDocument(userId: string, documentId: string) {
    // Verifica se o documento pertence ao usuário
    const doc = await this.prisma.userDocument.findFirst({
      where: { id: documentId, userId },
    });

    if (!doc) {
      throw new UnauthorizedException('Document not found');
    }

    // Limpa o ficheiro anexado do disco (se existir)
    this.uploadService.cleanupFile(doc.filePath);

    const result = await this.prisma.userDocument.delete({
      where: { id: documentId },
    });
    return result;
  }

  // ==========================================================================
  // BANK ACCOUNTS - Gerenciamento de Contas Bancárias
  // ==========================================================================

  /**
   * Adiciona uma nova conta bancária ao usuário.
   */
  async addBankAccount(userId: string, dto: CreateBankAccountDto) {
    const result = await this.prisma.userBankAccount.create({
      data: {
        userId,
        bankName: dto.bankName,
        iban: dto.iban,
        bicSwift: dto.bicSwift,
        accountHolder: dto.accountHolder,
        isPrimary: dto.isPrimary ?? false,
        description: dto.description,
      },
    });
    return result;
  }

  /**
   * Atualiza uma conta bancária existente.
   */
  async updateBankAccount(userId: string, accountId: string, dto: UpdateBankAccountDto) {
    // Verifica se a conta pertence ao usuário
    const account = await this.prisma.userBankAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new UnauthorizedException('Bank account not found');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.bankName !== undefined) updateData.bankName = dto.bankName;
    if (dto.iban !== undefined) updateData.iban = dto.iban;
    if (dto.bicSwift !== undefined) updateData.bicSwift = dto.bicSwift;
    if (dto.accountHolder !== undefined) updateData.accountHolder = dto.accountHolder;
    if (dto.isPrimary !== undefined) updateData.isPrimary = dto.isPrimary;
    if (dto.description !== undefined) updateData.description = dto.description;

    return this.prisma.userBankAccount.update({
      where: { id: accountId },
      data: updateData,
    });
  }

  /**
   * Remove uma conta bancária.
   */
  async removeBankAccount(userId: string, accountId: string) {
    // Verifica se a conta pertence ao usuário
    const account = await this.prisma.userBankAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new UnauthorizedException('Bank account not found');
    }

    const result = await this.prisma.userBankAccount.delete({
      where: { id: accountId },
    });
    return result;
  }

  // ==========================================================================
  // PPE (EPIs) - Gerenciamento de Equipamentos de Proteção Individual
  // ==========================================================================

  /**
   * Adiciona um novo EPI ao usuário.
   *
   * PASSO A PASSO:
   * 1. Cria o EPI com os dados fornecidos (nome, tipo, marca, serial, etc.)
   * 2. O EPI é associado ao usuário via userId
   * 3. Retorna o EPI criado
   *
   * @param userId - ID do usuário
   * @param dto - Dados do EPI (CreatePpeDto)
   * @returns EPI criado
   */
  async addPpe(userId: string, dto: CreatePpeDto) {
    const result = await this.prisma.userPpe.create({
      data: {
        userId,
        name: dto.name,
        category: dto.category ?? 'COMPANY_PROVIDED',
        type: dto.type,
        brand: dto.brand,
        model: dto.model,
        serialNumber: dto.serialNumber,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        lastInspectionDate: dto.lastInspectionDate ? new Date(dto.lastInspectionDate) : null,
        nextInspectionDate: dto.nextInspectionDate ? new Date(dto.nextInspectionDate) : null,
        condition: dto.condition ?? 'GOOD',
        notes: dto.notes,
        // Ficheiro anexado (certificado de inspeção, foto, etc.)
        filePath: dto.filePath ?? null,
      },
    });
    this.logger.log(`PPE added for user ${userId}: ${dto.name} (${result.id})`);
    return result;
  }

  /**
   * Atualiza um EPI existente.
   *
   * PASSO A PASSO:
   * 1. Verifica se o EPI pertence ao usuário (ownership)
   * 2. Atualiza apenas os campos fornecidos (atualização parcial)
   * 3. Retorna o EPI atualizado
   *
   * @param userId - ID do usuário (para verificar ownership)
   * @param ppeId - ID do EPI a atualizar
   * @param dto - Dados para atualização (UpdatePpeDto)
   * @returns EPI atualizado
   */
  async updatePpe(userId: string, ppeId: string, dto: UpdatePpeDto) {
    // Verifica se o EPI pertence ao usuário
    const ppe = await this.prisma.userPpe.findFirst({
      where: { id: ppeId, userId },
    });

    if (!ppe) {
      throw new UnauthorizedException('PPE not found');
    }

    // Monta os dados de atualização (apenas campos fornecidos)
    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.brand !== undefined) updateData.brand = dto.brand;
    if (dto.model !== undefined) updateData.model = dto.model;
    if (dto.serialNumber !== undefined) updateData.serialNumber = dto.serialNumber;
    if (dto.purchaseDate !== undefined) updateData.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : null;
    if (dto.lastInspectionDate !== undefined) updateData.lastInspectionDate = dto.lastInspectionDate ? new Date(dto.lastInspectionDate) : null;
    if (dto.nextInspectionDate !== undefined) updateData.nextInspectionDate = dto.nextInspectionDate ? new Date(dto.nextInspectionDate) : null;
    if (dto.condition !== undefined) updateData.condition = dto.condition;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    // Se filePath mudou, limpa o ficheiro antigo do disco
    if (dto.filePath !== undefined && dto.filePath !== ppe.filePath) {
      this.uploadService.cleanupFile(ppe.filePath);
    }
    if (dto.filePath !== undefined) updateData.filePath = dto.filePath || null;

    return this.prisma.userPpe.update({
      where: { id: ppeId },
      data: updateData,
    });
  }

  /**
   * Remove um EPI do usuário.
   * O ficheiro anexado é removido automaticamente do disco.
   *
   * PASSO A PASSO:
   * 1. Verifica se o EPI pertence ao usuário (ownership)
   * 2. Limpa o ficheiro do disco (se existir)
   * 3. Remove o EPI fisicamente (não usa soft delete, pois é sub-recurso do perfil)
   *
   * @param userId - ID do usuário (para verificar ownership)
   * @param ppeId - ID do EPI a remover
   */
  async removePpe(userId: string, ppeId: string) {
    // Verifica se o EPI pertence ao usuário
    const ppe = await this.prisma.userPpe.findFirst({
      where: { id: ppeId, userId },
    });

    if (!ppe) {
      throw new UnauthorizedException('PPE not found');
    }

    // Limpa o ficheiro anexado do disco (se existir)
    this.uploadService.cleanupFile(ppe.filePath);

    const result = await this.prisma.userPpe.delete({
      where: { id: ppeId },
    });
    this.logger.log(`PPE removed for user ${userId}: ${ppeId}`);
    return result;
  }

  // ==========================================================================
  // ASSINATURA COMO FICHEIRO
  // ==========================================================================

  /**
   * Converte uma string base64 de assinatura em um ficheiro PNG no disco.
   *
   * SEGURANÇA: A assinatura é salva como ficheiro no diretório do usuário
   * em vez de ser armazenada como base64 no banco de dados.
   * Isso evita armazenar dados grandes em campos de texto e facilita
   * o backup e a gestão de ficheiros.
   *
   * @param userId - ID do usuário (determina o diretório)
   * @param base64Data - String base64 com prefixo "data:image/...;base64,"
   * @returns Caminho relativo do ficheiro salvo (ex: "userId/signatures/signature-uuid.png")
   */
  private saveSignatureAsFile(userId: string, base64Data: string): string {
    // Valida formato: deve começar com data:image/ (PNG, JPEG, etc.)
    const matches = base64Data.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!matches) {
      throw new BadRequestException(
        'Invalid signature format. Must be a data:image/<type>;base64,... string.',
      );
    }

    const [, extension, base64Content] = matches;
    const buffer = Buffer.from(base64Content, 'base64');

    // Limite de 500KB para evitar armazenamento excessivo
    const MAX_SIGNATURE_SIZE = 500 * 1024;
    if (buffer.length > MAX_SIGNATURE_SIZE) {
      throw new BadRequestException(
        'Signature image too large. Maximum size is 500KB.',
      );
    }

    // Diretório de assinaturas do usuário
    const uploadDir = this.configService.get<string>('UPLOAD_DIR') ?? './uploads';
    const signaturesDir = join(uploadDir, userId, 'signatures');

    // Cria o diretório se não existir
    if (!existsSync(signaturesDir)) {
      mkdirSync(signaturesDir, { recursive: true });
    }

    // Gera nome único e salva no disco
    const fileName = `signature-${uuidv4()}.${extension}`;
    const filePath = join(signaturesDir, fileName);
    writeFileSync(filePath, buffer);

    // Retorna o caminho relativo (sem o uploadDir)
    const relativePath = relative(uploadDir, filePath);
    this.logger.log(`Signature saved as file: ${relativePath} (${buffer.length} bytes)`);

    return relativePath;
  }

  // ==========================================================================
  // REFRESH TOKEN — Sistema de Login Persistente
  // ==========================================================================

  /**
   * Gera um novo refresh token para o usuário e armazena hasheado no DB.
   *
   * SEGURANÇA:
   * - O token é um UUID aleatório criptograficamente seguro
   * - Apenas o hash (SHA-256) é armazenado no banco
   * - O valor original é retornado para ser enviado como cookie httpOnly
   * - Expira conforme JWT_REFRESH_EXPIRES_IN (padrão: 30 dias)
   *
   * @param userId - ID do usuário
   * @param userAgent - User-Agent do browser (para auditoria)
   * @param ipAddress - IP do cliente (para auditoria)
   * @returns O valor original do refresh token (para o cookie)
   */
  private async generateRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    // Gera um token aleatório seguro (32 bytes = 64 chars hex)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Hashea o token para armazenar no DB (SHA-256)
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Calcula a data de expiração
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d';
    const expiresAt = new Date();
    const days = parseInt(refreshExpiresIn.replace('d', ''), 10) || 30;
    expiresAt.setDate(expiresAt.getDate() + days);

    // Salva o token hasheado no banco
    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    return rawToken;
  }

  /**
   * Renova o access token usando um refresh token válido.
   *
   * FLUXO:
   * 1. Hashea o refresh token recebido
   * 2. Busca no DB pelo hash
   * 3. Verifica se não expirou
   * 4. Verifica se o usuário ainda existe e está ativo
   * 5. Gera novo access token + novo refresh token (rotação)
   * 6. Invalida o refresh token antigo
   *
   * @param rawRefreshToken - O valor do refresh token (do cookie httpOnly)
   * @param userAgent - User-Agent do browser
   * @param ipAddress - IP do cliente
   * @returns Novo access token + novo refresh token
   */
  async refreshAccessToken(
    rawRefreshToken: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Hashea o token recebido para comparar com o hash armazenado
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    // Busca o refresh token no banco
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // Token não encontrado ou expirado
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      // Remove o token expirado do banco
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Verifica se o usuário ainda existe e está ativo
    const user = storedToken.user;
    if (!user || !user.isActive || user.deletedAt !== null) {
      throw new UnauthorizedException('User account is no longer active');
    }

    // ROTAÇÃO: Deleta o refresh token antigo e cria um novo
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Gera novo access token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      profileComplete: user.profileComplete,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    // Gera novo refresh token
    const refreshToken = await this.generateRefreshToken(user.id, userAgent, ipAddress);

    return { accessToken, refreshToken };
  }

  /**
   * Faz o logout do usuário, invalidando o refresh token.
   *
   * @param rawRefreshToken - O valor do refresh token (do cookie httpOnly)
   * @param userId - ID do usuário (para log)
   */
  async logout(rawRefreshToken: string, userId: string): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      // Remove o refresh token do banco (invalida a sessão)
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }

    // Remove todos os tokens expirados do usuário (limpeza)
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    });

    this.logger.log(`User logged out: userId=${userId}`);
  }

  // ==========================================================================
  // SUGESTÕES DE LOGIN — Autocomplete público da tela de login
  // ==========================================================================

  /**
   * GET /api/v1/auth/login-suggestions
   *
   * Lista mínima de utilizadores para o autocomplete da tela de login.
   *
   * SEGURANÇA:
   * - Endpoint público (pré-autenticação) protegido por rate limiting
   * - Retorna APENAS nome e e-mail — nenhum dado sensível
   * - Somente utilizadores ativos e não removidos
   */
  async getLoginSuggestions(): Promise<{ name: string; email: string }[]> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      select: { firstName: true, lastName: true, email: true },
      orderBy: { firstName: 'asc' },
    });

    return users.map((u) => ({
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
    }));
  }
}
