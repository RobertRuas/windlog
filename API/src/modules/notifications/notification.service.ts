/**
 * ============================================================================
 * NOTIFICATION SERVICE - Serviço de Notificações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Serviço responsável por gerir notificações do sistema.
 * Fornece métodos para criar, consultar e atualizar notificações.
 *
 * COMO FUNCIONA?
 * --------------
 * - create(): cria uma nova notificação para um usuário
 * - findAll(): retorna notificações paginadas com filtros
 * - findById(): retorna uma notificação específica
 * - update(): atualiza o estado de uma notificação (lida/não lida)
 * - markAsRead(): marca uma notificação como lida
 * - markAllAsRead(): marca todas as notificações como lidas
 * - getUnreadCount(): retorna contagem de notificações não lidas
 * - delete(): remove uma notificação
 *
 * BOAS PRÁTICAS:
 * --------------
 * - Notificações são criadas de forma assíncrona para não bloquear
 * - Cada notificação pertence a um usuário específico
 * - Notificações podem ter contexto (entity, entityId) para navegação
 * ============================================================================
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  CreateNotificationDto,
  NotificationFilterDto,
  UpdateNotificationDto,
  NotificationPriority,
} from './dto/notification.dto.js';

/**
 * Serviço NotificationService - Gerencia notificações dos usuários.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova notificação para um usuário.
   * Método assíncrono para não bloquear a resposta ao cliente.
   *
   * @param data - Dados da notificação (CreateNotificationDto)
   * @returns Promise com a notificação criada
   */
  async create(data: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          type: data.type,
          priority: data.priority || NotificationPriority.MEDIUM,
          title: data.title,
          message: data.message,
          userId: data.userId,
          entity: data.entity,
          entityId: data.entityId,
          metadata: data.metadata || undefined,
        },
      });

      this.logger.debug(`Notificação criada: ${data.type} - ${data.title} para usuário ${data.userId}`);
      return notification;
    } catch (error) {
      // Não lançamos erro para não afetar o fluxo principal
      this.logger.error(`Erro ao criar notificação: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Retorna notificações paginadas com filtros.
   *
   * @param userId - ID do usuário destinatário
   * @param filter - Filtros de busca (NotificationFilterDto)
   * @returns Promise com notificações paginadas e total
   */
  async findAll(userId: string, filter: NotificationFilterDto) {
    const { search, type, priority, isRead, startDate, endDate, page = 1, limit = 20 } = filter;

    // Constrói o where clause dinamicamente
    const where: any = { userId };

    // Busca textual (título, mensagem)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtros específicos
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (isRead !== undefined) where.isRead = isRead;

    // Filtro por período
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Calcula offset para paginação
    const skip = (page - 1) * limit;

    // Executa consultas em paralelo
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: [
          { isRead: 'asc' }, // Não lidas primeiro
          { createdAt: 'desc' }, // Mais recentes primeiro
        ],
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
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
   * Retorna uma notificação específica por ID.
   *
   * @param id - ID da notificação
   * @param userId - ID do usuário (para garantir que pertence a ele)
   * @returns Promise com a notificação ou null se não encontrada
   */
  async findById(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return notification;
  }

  /**
   * Atualiza uma notificação (marcar como lida/não lida).
   *
   * @param id - ID da notificação
   * @param userId - ID do usuário (para garantir que pertence a ele)
   * @param data - Dados de atualização (UpdateNotificationDto)
   * @returns Promise com a notificação atualizada
   */
  async update(id: string, userId: string, data: UpdateNotificationDto) {
    // Verifica se a notificação existe e pertence ao usuário
    await this.findById(id, userId);

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: data.isRead,
        readAt: data.isRead ? new Date() : null,
      },
    });
  }

  /**
   * Marca uma notificação como lida.
   *
   * @param id - ID da notificação
   * @param userId - ID do usuário
   * @returns Promise com a notificação atualizada
   */
  async markAsRead(id: string, userId: string) {
    return this.update(id, userId, { isRead: true });
  }

  /**
   * Marca todas as notificações de um usuário como lidas.
   *
   * @param userId - ID do usuário
   * @returns Promise com quantidade de notificações atualizadas
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    this.logger.debug(`Marcadas ${result.count} notificações como lidas para usuário ${userId}`);
    return { count: result.count };
  }

  /**
   * Retorna a contagem de notificações não lidas de um usuário.
   *
   * @param userId - ID do usuário
   * @returns Promise com contagem de notificações não lidas
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  /**
   * Remove uma notificação.
   *
   * @param id - ID da notificação
   * @param userId - ID do usuário (para garantir que pertence a ele)
   * @returns Promise com a notificação removida
   */
  async delete(id: string, userId: string) {
    // Verifica se a notificação existe e pertence ao usuário
    await this.findById(id, userId);

    return this.prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Remove todas as notificações lidas de um usuário.
   *
   * @param userId - ID do usuário
   * @returns Promise com quantidade de notificações removidas
   */
  async deleteRead(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });

    this.logger.debug(`Removidas ${result.count} notificações lidas para usuário ${userId}`);
    return { count: result.count };
  }

  /**
   * Verifica se o perfil do usuário está completo.
   * Um perfil é considerado completo quando todos os campos importantes estão preenchidos.
   *
   * @param userId - ID do usuário
   * @returns true se o perfil está completo, false caso contrário
   */
  async isProfileComplete(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) return false;

    // Campos importantes que devem estar preenchidos
    const requiredFields = [
      user.phone,
      user.dateOfBirth,
      user.nationality,
      user.address,
      user.city,
      user.postalCode,
      user.country,
      user.department,
      user.position,
      user.hireDate,
    ];

    // Verifica se todos os campos estão preenchidos (não null/undefined)
    return requiredFields.every((field) => field !== null && field !== undefined);
  }

  /**
   * Cria notificação de perfil incompleto se o perfil não estiver completo.
   * Se o perfil estiver completo, remove a notificação existente.
   *
   * @param userId - ID do usuário
   * @param userName - Nome do usuário (para a mensagem)
   */
  async syncProfileIncompleteNotification(userId: string, userName?: string): Promise<void> {
    const isComplete = await this.isProfileComplete(userId);

    // Verifica se já existe uma notificação de perfil incompleto
    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: 'PROFILE_INCOMPLETE',
      },
    });

    if (isComplete) {
      // Perfil completo: remove a notificação se existir
      if (existingNotification) {
        await this.prisma.notification.delete({
          where: { id: existingNotification.id },
        });
        this.logger.debug(`Notificação de perfil incompleto removida para usuário ${userId}`);
      }
    } else {
      // Perfil incompleto: cria ou atualiza notificação
      if (!existingNotification) {
        // Cria nova notificação se não existir
        await this.prisma.notification.create({
          data: {
            type: 'PROFILE_INCOMPLETE',
            priority: 'MEDIUM',
            title: 'Complete o seu perfil',
            message: `Olá ${userName || ''}! Por favor, complete todos os dados do seu perfil para continuar a utilizar todas as funcionalidades do sistema.`,
            userId,
            entity: 'User',
            entityId: userId,
          },
        });
        this.logger.debug(`Notificação de perfil incompleto criada para usuário ${userId}`);
      } else if (existingNotification.isRead) {
        // Se já existe mas foi marcada como lida, volta a marcar como não lida
        // Isso garante que a notificação persiste até o perfil ser completado
        await this.prisma.notification.update({
          where: { id: existingNotification.id },
          data: {
            isRead: false,
            readAt: null,
          },
        });
        this.logger.debug(`Notificação de perfil incompleto reativada para usuário ${userId}`);
      }
      // Se já existe e está como não lida, não faz nada (evita duplicação)
    }
  }
}
