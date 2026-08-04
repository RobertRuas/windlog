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
import { NotificationService } from '../notifications/notification.service.js';
import { UploadService } from '../upload/upload.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
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
    private readonly notificationService: NotificationService,
    private readonly uploadService: UploadService,
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
      profileComplete: user.profileComplete,
    };

    const token = await this.jwtService.signAsync(payload);

    // Registra a operação no log
    this.logger.log(`User logged in: ${user.email} (${user.id})`);

    // Sincroniza notificação de perfil incompleto (para usuários existentes)
    const userName = `${user.firstName} ${user.lastName}`;
    await this.notificationService.syncProfileIncompleteNotification(user.id, userName);

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
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          nationality: dto.nationality,
          dateOfBirth: new Date(dto.dateOfBirth),
          email: dto.email,
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
    if (dto.signatureData !== undefined) updateData.signatureData = dto.signatureData;

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

    // Sincroniza notificação de perfil incompleto
    const userName = `${updatedUser.firstName} ${updatedUser.lastName}`;
    await this.notificationService.syncProfileIncompleteNotification(updatedUser.id, userName);

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
    await this.syncProfileNotification(userId);
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
    await this.syncProfileNotification(userId);
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
    await this.syncProfileNotification(userId);
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
    await this.syncProfileNotification(userId);
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
    await this.syncProfileNotification(userId);
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
    await this.syncProfileNotification(userId);
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
    await this.syncProfileNotification(userId);
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
    await this.syncProfileNotification(userId);
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
    await this.syncProfileNotification(userId);
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
    await this.syncProfileNotification(userId);
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

  /**
   * Helper: sincroniza a notificação de perfil incompleto.
   * Busca o nome do usuário automaticamente.
   */
  private async syncProfileNotification(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await this.notificationService.syncProfileIncompleteNotification(
          userId,
          `${user.firstName} ${user.lastName}`,
        );
      }
    } catch (err) {
      this.logger.warn(`Falha ao sincronizar notificação de perfil para ${userId}: ${err.message}`);
    }
  }
}
