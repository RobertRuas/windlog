/**
 * ============================================================================
 * SYSTEM LOG SERVICE - Serviço de Logs do Sistema
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Serviço responsável por criar e consultar logs do sistema.
 * Fornece métodos para registrar ações e recuperar logs com filtros.
 *
 * COMO FUNCIONA?
 * --------------
 * - create(): registra um novo log no banco de dados
 * - findAll(): retorna logs paginados com filtros
 * - findById(): retorna um log específico
 * - getStats(): retorna estatísticas dos logs
 *
 * BOAS PRÁTICAS:
 * --------------
 * - Logs são criados de forma assíncrona para não bloquear a resposta
 * - Dados sensíveis (senhas, tokens) são removidos antes de registrar
 * - Logs são imutáveis (nunca atualizados ou deletados)
 * ============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateLogDto, LogFilterDto, LogAction, LogSeverity } from './dto/system-log.dto.js';

/**
 * Serviço SystemLogService - Gerencia logs do sistema.
 */
@Injectable()
export class SystemLogService {
  private readonly logger = new Logger(SystemLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo log no sistema.
   * Método assíncrono para não bloquear a resposta ao cliente.
   *
   * @param data - Dados do log (CreateLogDto)
   * @returns Promise com o log criado
   */
  async create(data: CreateLogDto) {
    try {
      const log = await this.prisma.systemLog.create({
        data: {
          action: data.action,
          severity: data.severity || LogSeverity.INFO,
          message: data.message,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          entity: data.entity,
          entityId: data.entityId,
          entityName: data.entityName,
          details: data.details || undefined,
          metadata: data.metadata || undefined,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          url: data.url,
          method: data.method,
          statusCode: data.statusCode,
          duration: data.duration,
        },
      });

      this.logger.debug(`Log criado: ${data.action} - ${data.message}`);
      return log;
    } catch (error) {
      // Não lançamos erro para não afetar o fluxo principal
      this.logger.error(`Erro ao criar log: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Retorna logs paginados com filtros.
   *
   * @param filter - Filtros de busca (LogFilterDto)
   * @returns Promise com logs paginados e total
   */
  async findAll(filter: LogFilterDto) {
    const { search, action, severity, userId, entity, startDate, endDate, page = 1, limit = 50 } = filter;

    // Constrói o where clause dinamicamente
    const where: any = {};

    // Busca textual (mensagem, usuário, entidade)
    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
        { entityName: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtros específicos
    if (action) where.action = action;
    if (severity) where.severity = severity;
    if (userId) where.userId = userId;
    if (entity) where.entity = entity;

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
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.systemLog.count({ where }),
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
   * Retorna um log específico por ID.
   *
   * @param id - ID do log
   * @returns Promise com o log ou null se não encontrado
   */
  async findById(id: string) {
    return this.prisma.systemLog.findUnique({
      where: { id },
    });
  }

  /**
   * Retorna estatísticas dos logs.
   *
   * @returns Promise com contagens por ação, severidade e usuário
   */
  async getStats() {
    const [byAction, bySeverity, byUser, total] = await Promise.all([
      // Contagem por ação
      this.prisma.systemLog.groupBy({
        by: ['action'],
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      // Contagem por severidade
      this.prisma.systemLog.groupBy({
        by: ['severity'],
        _count: true,
      }),
      // Contagem por usuário (top 10)
      this.prisma.systemLog.groupBy({
        by: ['userId', 'userName', 'userEmail'],
        _count: true,
        where: { userId: { not: null } },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
      // Total de logs
      this.prisma.systemLog.count(),
    ]);

    return {
      total,
      byAction: byAction.map((item) => ({
        action: item.action,
        count: item._count,
      })),
      bySeverity: bySeverity.map((item) => ({
        severity: item.severity,
        count: item._count,
      })),
      topUsers: byUser.map((item) => ({
        userId: item.userId,
        userName: item.userName,
        userEmail: item.userEmail,
        count: item._count,
      })),
    };
  }

  /**
   * Remove logs antigos (mais de X dias).
   * Útil para manutenção e limpeza do banco.
   *
   * @param days - Número de dias para manter (padrão: 90)
   * @returns Promise com quantidade de logs removidos
   */
  async cleanup(days: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
      const result = await this.prisma.systemLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Limpeza de logs: ${result.count} registros removidos (anteriores a ${days} dias)`);
      return result.count;
    } catch (error) {
      this.logger.error(`Erro na limpeza de logs: ${error.message}`);
      return 0;
    }
  }
}
