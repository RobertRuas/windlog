/**
 * ============================================================================
 * FEEDBACK SERVICE - Serviço de Gestão de Feedbacks do Sistema
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém toda a lógica de negócio para gestão de Feedbacks.
 * Implementa CRUD com controle de acesso baseado em roles.
 *
 * REGRAS DE NEGÓCIO:
 * ------------------
 * - Qualquer usuário autenticado pode CRIAR feedbacks
 * - Apenas ADMIN pode LISTAR, VISUALIZAR, ATUALIZAR e EXCLUIR feedbacks
 * - Feedbacks seguem soft delete (nunca removidos fisicamente)
 * - Ao resolver/fechar, registra quem resolveu e quando
 * ============================================================================
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import { UploadService } from '../upload/upload.service.js';
import { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import { UpdateFeedbackDto } from './dto/update-feedback.dto.js';
import { FeedbackFilterDto } from './dto/feedback-filter.dto.js';

/**
 * Serviço FeedbackService - Gerencia operações CRUD de feedbacks.
 */
@Injectable()
export class FeedbackService {
  // Logger para registrar operações
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  // =========================================================================
  // CRUD - Operações principais
  // =========================================================================

  /**
   * Cria um novo Feedback.
   *
   * PASSO A PASSO:
   * 1. Qualquer usuário autenticado pode criar
   * 2. Captura dados do usuário + contexto técnico
   * 3. Status inicial: NEW, Prioridade: MEDIUM
   * 4. Retorna o feedback criado
   *
   * @param dto - Dados para criação (CreateFeedbackDto)
   * @param userId - ID do usuário que está reportando
   * @returns Feedback criado
   */
  async create(dto: CreateFeedbackDto, userId: string) {
    // Cria o feedback com os dados fornecidos
    const feedback = await this.prisma.feedback.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: (dto.category as any) || 'OTHER',
        screenshotPath: dto.screenshotPath,
        pageUrl: dto.pageUrl,
        userAgent: dto.userAgent,
        screenResolution: dto.screenResolution,
        technicalContext: dto.technicalContext,
        consoleLogs: dto.consoleLogs,
        recentSystemLogs: dto.recentSystemLogs,
        reportedBy: userId,
        status: 'NEW',
        priority: 'MEDIUM',
      },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Feedback created: "${dto.title}" by user ${userId} (${feedback.id})`,
    );

    return feedback;
  }

  /**
   * Lista os feedbacks do próprio usuário.
   *
   * @param userId - ID do usuário
   * @returns Lista de feedbacks do usuário ordenados por data (mais recente primeiro)
   */
  async findMyFeedbacks(userId: string) {
    const feedbacks = await this.prisma.feedback.findMany({
      where: { reportedBy: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        status: true,
        priority: true,
        createdAt: true,
        adminNotes: true,
        resolvedAt: true,
      },
    });

    return feedbacks;
  }

  /**
   * Busca um feedback pelo ID com todas as relações.
   *
   * @param id - ID do feedback
   * @returns Feedback completo com relação ao reporter
   * @throws NotFoundException se não existir
   */
  async findById(id: string) {
    const feedback = await this.prisma.feedback.findFirst({
      where: { id, deletedAt: null },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return feedback;
  }

  /**
   * Lista feedbacks com paginação e filtros.
   *
   * @param filter - Filtros (categoria, status, prioridade, busca)
   * @returns Lista paginada de feedbacks com total
   */
  async findAll(filter: FeedbackFilterDto) {
    const { category, status, priority, search, page = 1, limit = 10 } = filter;

    // Constrói o where clause dinamicamente
    const where: any = { deletedAt: null };

    if (category) where.category = category;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    // Busca textual no título e descrição
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Busca com paginação
    const [data, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Atualiza um feedback (apenas ADMIN).
   *
   * PASSO A PASSO:
   * 1. Busca o feedback e verifica se existe
   * 2. Atualiza prioridade, status e/ou notas
   * 3. Se status = RESOLVED ou CLOSED, registra resolvedBy e resolvedAt
   *
   * @param id - ID do feedback
   * @param dto - Dados para atualização (UpdateFeedbackDto)
   * @param adminId - ID do administrador que está atualizando
   * @returns Feedback atualizado
   */
  async update(id: string, dto: UpdateFeedbackDto, adminId: string) {
    // Busca o feedback
    const feedback = await this.prisma.feedback.findFirst({
      where: { id, deletedAt: null },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    // Monta os dados de atualização
    const updateData: any = {};

    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.adminNotes !== undefined) updateData.adminNotes = dto.adminNotes;

    // Se status = RESOLVED ou CLOSED, registra quem resolveu e quando
    if (
      dto.status &&
      (dto.status === 'RESOLVED' || dto.status === 'CLOSED')
    ) {
      updateData.resolvedBy = adminId;
      updateData.resolvedAt = new Date();
    }

    // Se status mudou de RESOLVED/CLOSED para outro, limpa resolvedBy
    if (
      dto.status &&
      dto.status !== 'RESOLVED' &&
      dto.status !== 'CLOSED' &&
      (feedback.status === 'RESOLVED' || feedback.status === 'CLOSED')
    ) {
      updateData.resolvedBy = null;
      updateData.resolvedAt = null;
    }

    // Atualiza o feedback
    const updated = await this.prisma.feedback.update({
      where: { id },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Feedback updated: ${id} by admin ${adminId} (status: ${dto.status || feedback.status})`,
    );

    return updated;
  }

  /**
   * Remove um feedback (soft delete - apenas ADMIN).
   * O screenshot associado é removido automaticamente do disco.
   *
   * @param id - ID do feedback
   */
  async remove(id: string) {
    const feedback = await this.prisma.feedback.findFirst({
      where: { id, deletedAt: null },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    // Limpa o screenshot do disco (se existir)
    this.uploadService.cleanupFile(feedback.screenshotPath);

    // Soft delete: marca a data de exclusão
    await this.prisma.feedback.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Feedback soft-deleted: ${id}`);

    return { message: 'Feedback deleted successfully' };
  }

  /**
   * Retorna estatísticas dos feedbacks.
   *
   * @returns Contagens por status, categoria e prioridade
   */
  async getStats() {
    const [byStatus, byCategory, byPriority, total, newCount] =
      await Promise.all([
        // Contagem por status
        this.prisma.feedback.groupBy({
          by: ['status'],
          _count: true,
          where: { deletedAt: null },
        }),
        // Contagem por categoria
        this.prisma.feedback.groupBy({
          by: ['category'],
          _count: true,
          where: { deletedAt: null },
        }),
        // Contagem por prioridade
        this.prisma.feedback.groupBy({
          by: ['priority'],
          _count: true,
          where: { deletedAt: null },
        }),
        // Total de feedbacks ativos
        this.prisma.feedback.count({ where: { deletedAt: null } }),
        // Total de feedbacks novos (não triados)
        this.prisma.feedback.count({
          where: { deletedAt: null, status: 'NEW' },
        }),
      ]);

    return {
      total,
      newCount,
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      byCategory: byCategory.map((item) => ({
        category: item.category,
        count: item._count,
      })),
      byPriority: byPriority.map((item) => ({
        priority: item.priority,
        count: item._count,
      })),
    };
  }
}
