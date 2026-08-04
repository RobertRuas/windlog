/**
 * ============================================================================
 * USERS SERVICE - Serviço de Gestão de Usuários
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém toda a lógica de negócio para gestão de usuários do sistema.
 * Implementa CRUD completo com soft delete e validações.
 *
 * REGRAS DE NEGÓCIO:
 * ------------------
 * - Apenas ADMIN e HR podem gerenciar usuários
 * - Soft delete: usuários são desativados, nunca removidos
 * - Email deve ser único no sistema
 * - Senhas são criptografadas com bcrypt
 * - Logs de auditoria para todas as ações importantes
 * ============================================================================
 */

import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { PrismaService } from '../../database/prisma.service.js';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from './dto/users.dto.js';
import { NotificationService } from '../notifications/notification.service.js';

/**
 * Número de rounds do bcrypt para hashear senhas.
 * Deve ser o mesmo usado no auth.service.ts e seed.ts.
 */
const SALT_ROUNDS = 10;

/**
 * Serviço UsersService - Gerencia operações CRUD de usuários.
 */
@Injectable()
export class UsersService {
  // Logger para registrar operações de gestão de usuários
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Cria um novo usuário no sistema.
   *
   * PASSO A PASSO:
   * 1. Verifica se o email já existe
   * 2. Gera uma senha temporária aleatória
   * 3. Criptografa a senha temporária
   * 4. Cria o usuário no banco com mustChangePassword: true
   * 5. Retorna os dados sem a senha + a senha temporária em texto puro
   *
   * @param dto - Dados do usuário (CreateUserDto)
   * @returns Promise com o usuário criado (sem senha hash) + temporaryPassword
   * @throws ConflictException se o email já estiver em uso
   */
  async create(dto: CreateUserDto) {
    // PASSO 1: Verifica se o email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // PASSO 2: Gera uma senha temporária aleatória (12 caracteres)
    const temporaryPassword = crypto.randomBytes(6).toString('hex').slice(0, 12);

    // PASSO 3: Criptografa a senha temporária
    const hashedPassword = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

    // PASSO 4: Cria o usuário no banco com mustChangePassword: true
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || 'STANDARD',
        phone: dto.phone,
        phoneCountryCode: dto.phoneCountryCode,
        nationality: dto.nationality,
        department: dto.department,
        position: dto.position,
        mustChangePassword: true,
      },
    });

    // Registra a operação no log
    this.logger.log(`User created: ${user.email} (${user.id}) with temporary password`);

    // Cria notificação de perfil incompleto para o novo usuário
    const userName = `${dto.firstName} ${dto.lastName}`;
    await this.notificationService.syncProfileIncompleteNotification(user.id, userName);

    // PASSO 5: Retorna sem a senha hash, mas com a senha temporária em texto puro
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      temporaryPassword,
    };
  }

  /**
   * Lista todos os usuários com paginação e filtros.
   *
   * @param filter - Filtros de busca (UserFilterDto)
   * @returns Promise com usuários paginados e total
   */
  async findAll(filter: UserFilterDto) {
    const { search, role, isActive, page = 1, limit = 10 } = filter;

    // Constrói o where clause dinamicamente
    // Exclui usuários deletados (soft delete) por padrão
    const where: any = { deletedAt: null };

    // Busca por nome ou email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtros específicos
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    // Calcula offset para paginação
    const skip = (page - 1) * limit;

    // Executa consultas em paralelo
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          phone: true,
          department: true,
          position: true,
          isTeamLeader: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Busca um usuário específico por ID.
   *
   * @param id - ID do usuário
   * @returns Promise com os dados do usuário
   * @throws NotFoundException se o usuário não existir
   */
  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        phoneNumbers: true,
        certifications: true,
        languages: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Atualiza os dados de um usuário.
   *
   * PASSO A PASSO:
   * 1. Verifica se o usuário existe
   * 2. Se email mudou, verifica se não está em uso
   * 3. Se senha mudou, criptografa
   * 4. Atualiza apenas os campos fornecidos
   *
   * @param id - ID do usuário
   * @param dto - Dados a atualizar (UpdateUserDto)
   * @returns Promise com o usuário atualizado
   * @throws NotFoundException se o usuário não existir
   * @throws ConflictException se o novo email já estiver em uso
   */
  async update(id: string, dto: UpdateUserDto) {
    // PASSO 1: Verifica se o usuário existe
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // PASSO 2: Se email mudou, verifica se não está em uso
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }
    }

    // PASSO 3: Prepara os dados para atualização
    const updateData: Record<string, unknown> = {};

    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.phoneCountryCode !== undefined) updateData.phoneCountryCode = dto.phoneCountryCode;
    if (dto.nationality !== undefined) updateData.nationality = dto.nationality;
    if (dto.department !== undefined) updateData.department = dto.department;
    if (dto.position !== undefined) updateData.position = dto.position;
    if (dto.isTeamLeader !== undefined) updateData.isTeamLeader = dto.isTeamLeader;

    // PASSO 4: Se senha mudou, criptografa
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    // Atualiza o usuário no banco
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Registra a operação no log
    this.logger.log(`User updated: ${updatedUser.email} (${updatedUser.id})`);

    // Sincroniza notificação de perfil incompleto
    const userName = `${updatedUser.firstName} ${updatedUser.lastName}`;
    await this.notificationService.syncProfileIncompleteNotification(updatedUser.id, userName);

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Remove um usuário (soft delete).
   * Marca o usuário como deletado em vez de remover do banco.
   *
   * @param id - ID do usuário
   * @returns Promise com o usuário desativado
   * @throws NotFoundException se o usuário não existir
   */
  async remove(id: string) {
    // Verifica se o usuário existe
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete: marca deletedAt e desativa
    const deletedUser = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Registra a operação no log
    this.logger.log(`User deleted: ${deletedUser.email} (${deletedUser.id})`);

    return this.sanitizeUser(deletedUser);
  }

  /**
   * Reseta a senha de um usuário, gerando uma nova senha temporária.
   * O usuário será obrigado a trocar a senha no próximo login.
   *
   * PASSO A PASSO:
   * 1. Verifica se o usuário existe
   * 2. Gera uma nova senha temporária aleatória
   * 3. Criptografa a senha temporária
   * 4. Atualiza o usuário com mustChangePassword: true
   * 5. Retorna a senha temporária em texto puro
   *
   * @param id - ID do usuário
   * @returns Objeto com temporaryPassword (texto puro)
   * @throws NotFoundException se o usuário não existir
   */
  async resetPassword(id: string) {
    // PASSO 1: Verifica se o usuário existe
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // PASSO 2: Gera uma nova senha temporária aleatória (12 caracteres)
    const temporaryPassword = crypto.randomBytes(6).toString('hex').slice(0, 12);

    // PASSO 3: Criptografa a senha temporária
    const hashedPassword = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

    // PASSO 4: Atualiza o usuário com mustChangePassword: true
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });

    // Registra a operação no log
    this.logger.log(`Password reset for user: ${user.email} (${user.id})`);

    // PASSO 5: Retorna a senha temporária em texto puro
    return { temporaryPassword };
  }

  /**
   * Remove a senha do objeto usuário antes de retornar.
   * Nunca devemos retornar a senha para o cliente.
   *
   * @param user - Objeto usuário completo
   * @returns Usuário sem o campo password
   */
  private sanitizeUser(user: any) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
