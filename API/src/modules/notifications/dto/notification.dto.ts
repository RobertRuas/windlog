/**
 * ============================================================================
 * NOTIFICATION DTOs - Data Transfer Objects para Notificações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os DTOs (Data Transfer Objects) para o módulo de notificações.
 * Inclui DTOs para criar notificações, filtrar consultas e atualizar estado.
 *
 * COMO FUNCIONA?
 * --------------
 * - CreateNotificationDto: usado para criar uma nova notificação
 * - NotificationFilterDto: usado para filtrar notificações nas consultas
 * - UpdateNotificationDto: usado para marcar notificação como lida
 * ============================================================================
 */

import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  Min,
  IsDateString,
  IsObject,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Enum de tipos de notificação disponíveis no sistema.
 * Deve ser mantido em sincronia com o enum NotificationType do Prisma.
 */
export enum NotificationType {
  // Ações obrigatórias (o usuário DEVE agir)
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',
  CERTIFICATION_EXPIRING = 'CERTIFICATION_EXPIRING',
  PASSWORD_EXPIRING = 'PASSWORD_EXPIRING',

  // Recomendações (o usuário DEVERIA agir)
  RECOMMENDED_ACTION = 'RECOMMENDED_ACTION',
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE',

  // Informativas (apenas para conhecimento)
  INFO = 'INFO',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  SUCCESS = 'SUCCESS',

  // Alertas
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

/**
 * Enum de prioridade das notificações.
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * DTO para criar uma nova notificação.
 */
export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, description: 'Tipo de notificação' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({ enum: NotificationPriority, description: 'Prioridade da notificação (padrão: MEDIUM)' })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiProperty({ description: 'Título da notificação' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Mensagem detalhada da notificação' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'ID do usuário destinatário' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Entidade relacionada (ex: "Project", "UserDocument")' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Metadata adicional em JSON' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO para filtrar notificações nas consultas.
 */
export class NotificationFilterDto {
  @ApiPropertyOptional({ description: 'Busca textual (título, mensagem)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: NotificationType, description: 'Filtrar por tipo específico' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationPriority, description: 'Filtrar por prioridade' })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ description: 'Filtrar por estado de leitura' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Data inicial (ISO format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final (ISO format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Página atual (padrão: 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página (padrão: 20, máx: 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

/**
 * DTO para atualizar uma notificação (marcar como lida/não lida).
 */
export class UpdateNotificationDto {
  @ApiProperty({ description: 'Se a notificação foi lida' })
  @IsBoolean()
  isRead: boolean;
}

/**
 * DTO de resposta para uma notificação individual.
 */
export class NotificationResponseDto {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  entity: string | null;
  entityId: string | null;
  metadata: Record<string, any> | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO de resposta paginada para notificações.
 */
export class NotificationPaginatedResponseDto {
  data: NotificationResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * DTO de resposta para contagem de notificações não lidas.
 */
export class UnreadCountResponseDto {
  count: number;
}
