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
   * Um perfil é considerado completo quando:
   * - Tem pelo menos um passaporte registrado (OBRIGATÓRIO)
   *
   * @param userId - ID do usuário
   * @returns Objeto com isComplete (boolean) e missingSections (string[])
   */
  async checkProfileCompleteness(userId: string): Promise<{ isComplete: boolean; missingSections: string[]; percentage: number }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        documents: true,
        phoneNumbers: true,
        bankAccounts: true,
        languages: true,
        certifications: true,
      },
    });

    if (!user) return { isComplete: false, missingSections: [], percentage: 0 };

    const missingSections: string[] = [];

    // Verifica cada seção do perfil
    // Identidade (opcional mas recomendado)
    if (!user.dateOfBirth) missingSections.push('identity');
    if (!user.nationality) missingSections.push('identity');
    if (!user.photoUrl) missingSections.push('identity');

    // Contato
    if (user.phoneNumbers.length === 0) missingSections.push('contact');

    // Localização
    if (!user.address) missingSections.push('location');
    if (!user.city) missingSections.push('location');
    if (!user.postalCode) missingSections.push('location');
    if (!user.country) missingSections.push('location');

    // Profissional
    if (!user.department) missingSections.push('professional');
    if (!user.position) missingSections.push('professional');
    if (!user.hireDate) missingSections.push('professional');

    // Sobre
    if (!user.bio) missingSections.push('about');

    // Documentos - PASSAPORTE É OBRIGATÓRIO
    const hasPassport = user.documents.some(doc => doc.type === 'PASSPORT');
    if (!hasPassport) missingSections.push('documents');

    // Dados Bancários
    if (user.bankAccounts.length === 0) missingSections.push('bankAccounts');

    // Idiomas
    if (user.languages.length === 0) missingSections.push('languages');

    // Certificações
    if (user.certifications.length === 0) missingSections.push('certifications');

    // Remove duplicatas
    const uniqueSections = [...new Set(missingSections)];

    // Calcula percentual simplificado (seções completas / total de seções)
    const totalSections = 9;
    const completedSections = totalSections - uniqueSections.length;
    const percentage = Math.round((completedSections / totalSections) * 100);

    // Perfil completo = sem seções faltantes (incluindo passaporte obrigatório)
    const isComplete = uniqueSections.length === 0;

    return { isComplete, missingSections: uniqueSections, percentage };
  }

  /**
   * Cria notificação de perfil incompleto se o perfil não estiver completo.
   * Se o perfil estiver completo, remove a notificação existente.
   * A notificação é persistente: reaparece se o usuário a marcar como lida
   * mas o perfil continuar incompleto.
   *
   * @param userId - ID do usuário
   * @param userName - Nome do usuário (para a mensagem)
   */
  async syncProfileIncompleteNotification(userId: string, userName?: string): Promise<void> {
    const { isComplete, missingSections, percentage } = await this.checkProfileCompleteness(userId);

    // Verifica se já existe uma notificação de perfil incompleto
    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: 'PROFILE_INCOMPLETE',
      },
    });

    if (isComplete) {
      // Perfil 100% completo: remove a notificação se existir
      if (existingNotification) {
        await this.prisma.notification.delete({
          where: { id: existingNotification.id },
        });
        this.logger.debug(`Perfil completo! Notificação removida para usuário ${userId}`);
      }
    } else {
      // Monta mensagem dinâmica baseada nas seções faltantes
      const hasPassportMissing = missingSections.includes('documents');
      const sectionLabels: Record<string, string> = {
        identity: 'dados pessoais',
        contact: 'contato',
        location: 'localização',
        professional: 'dados profissionais',
        about: 'biografia',
        documents: 'passaporte',
        bankAccounts: 'dados bancários',
        languages: 'idiomas',
        certifications: 'certificações',
      };

      const missingLabels = [...new Set(missingSections)]
        .slice(0, 4) // mostra no máximo 4
        .map(s => sectionLabels[s] || s)
        .join(', ');

      const moreCount = Math.max(0, [...new Set(missingSections)].length - 4);
      const moreText = moreCount > 0 ? ` e mais ${moreCount} seção(ões)` : '';

      const title = hasPassportMissing
        ? '⚠️ Passaporte obrigatório em falta'
        : `Perfil ${percentage}% completo`;

      const message = hasPassportMissing
        ? `${userName || 'Olá'}, o seu passaporte é obrigatório. Complete também: ${missingLabels}${moreText}.`
        : `${userName || 'Olá'}, o seu perfil está ${percentage}% completo. Falta: ${missingLabels}${moreText}.`;

      if (!existingNotification) {
        // Cria nova notificação se não existir
        await this.prisma.notification.create({
          data: {
            type: 'PROFILE_INCOMPLETE',
            priority: hasPassportMissing ? 'HIGH' : 'MEDIUM',
            title,
            message,
            userId,
            entity: 'User',
            entityId: userId,
            metadata: { percentage, missingSections: [...new Set(missingSections)] },
          },
        });
        this.logger.debug(`Notificação de perfil incompleto criada para usuário ${userId} (${percentage}%)`);
      } else {
        // Atualiza a notificação existente com dados frescos
        await this.prisma.notification.update({
          where: { id: existingNotification.id },
          data: {
            title,
            message,
            priority: hasPassportMissing ? 'HIGH' : 'MEDIUM',
            isRead: false, // Reaparece sempre que o perfil estiver incompleto
            readAt: null,
            metadata: { percentage, missingSections: [...new Set(missingSections)] },
          },
        });
        this.logger.debug(`Notificação de perfil incompleto atualizada para usuário ${userId} (${percentage}%)`);
      }
    }
  }
}
