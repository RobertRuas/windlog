/**
 * ============================================================================
 * SYSTEM LOG DTOs - Data Transfer Objects para Logs do Sistema
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os DTOs (Data Transfer Objects) para o módulo de logs do sistema.
 * Inclui DTOs para criar logs, filtrar consultas e retornar dados formatados.
 *
 * COMO FUNCIONA?
 * --------------
 * - CreateLogDto: usado para criar um novo log
 * - LogFilterDto: usado para filtrar logs nas consultas (busca, paginação, etc.)
 * - LogResponseDto: formato de resposta para o frontend
 * ============================================================================
 */

import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsDateString,
  IsObject,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Enum de ações de log disponíveis no sistema.
 * Deve ser mantido em sincronia com o enum LogAction do Prisma.
 */
export enum LogAction {
  // Autenticação
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',

  // Gestão de Usuários
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_DEACTIVATE = 'USER_DEACTIVATE',
  USER_REACTIVATE = 'USER_REACTIVATE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',

  // Perfil
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  PROFILE_VIEW = 'PROFILE_VIEW',

  // Telefones
  PHONE_ADD = 'PHONE_ADD',
  PHONE_UPDATE = 'PHONE_UPDATE',
  PHONE_DELETE = 'PHONE_DELETE',

  // Certificações
  CERTIFICATION_ADD = 'CERTIFICATION_ADD',
  CERTIFICATION_UPDATE = 'CERTIFICATION_UPDATE',
  CERTIFICATION_DELETE = 'CERTIFICATION_DELETE',

  // Idiomas
  LANGUAGE_ADD = 'LANGUAGE_ADD',
  LANGUAGE_UPDATE = 'LANGUAGE_UPDATE',
  LANGUAGE_DELETE = 'LANGUAGE_DELETE',

  // Documentos
  DOCUMENT_ADD = 'DOCUMENT_ADD',
  DOCUMENT_UPDATE = 'DOCUMENT_UPDATE',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',

  // Projetos
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROJECT_DELETE = 'PROJECT_DELETE',

  // Turbinas
  TURBINE_CREATE = 'TURBINE_CREATE',
  TURBINE_UPDATE = 'TURBINE_UPDATE',
  TURBINE_DELETE = 'TURBINE_DELETE',

  // Técnicos
  TECHNICIAN_CREATE = 'TECHNICIAN_CREATE',
  TECHNICIAN_UPDATE = 'TECHNICIAN_UPDATE',
  TECHNICIAN_DELETE = 'TECHNICIAN_DELETE',

  // Ficheiros de Projeto
  PROJECT_FILE_CREATE = 'PROJECT_FILE_CREATE',
  PROJECT_FILE_DELETE = 'PROJECT_FILE_DELETE',

  // Notificações
  NOTIFICATION_READ = 'NOTIFICATION_READ',
  NOTIFICATION_DELETE = 'NOTIFICATION_DELETE',

  // Sistema
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  API_ERROR = 'API_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',

  // Outros
  OTHER = 'OTHER',
}

/**
 * Enum de severidade dos logs.
 */
export enum LogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * DTO para criar um novo log no sistema.
 */
export class CreateLogDto {
  @ApiProperty({ enum: LogAction, description: 'Ação realizada' })
  @IsEnum(LogAction)
  action: LogAction;

  @ApiPropertyOptional({ enum: LogSeverity, description: 'Nível de severidade' })
  @IsOptional()
  @IsEnum(LogSeverity)
  severity?: LogSeverity;

  @ApiProperty({ description: 'Descrição legível da ação' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'ID do usuário que realizou a ação' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Nome do usuário' })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ description: 'Email do usuário' })
  @IsOptional()
  @IsString()
  userEmail?: string;

  @ApiPropertyOptional({ description: 'Tipo da entidade afetada' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ description: 'ID da entidade afetada' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Nome da entidade' })
  @IsOptional()
  @IsString()
  entityName?: string;

  @ApiPropertyOptional({ description: 'Detalhes adicionais em JSON' })
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Metadata adicional' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Endereço IP' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User-Agent do browser' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'URL acessada' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'Método HTTP' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ description: 'Código HTTP da resposta' })
  @IsOptional()
  @IsInt()
  statusCode?: number;

  @ApiPropertyOptional({ description: 'Tempo de execução em ms' })
  @IsOptional()
  @IsInt()
  duration?: number;
}

/**
 * DTO para filtrar logs nas consultas.
 */
export class LogFilterDto {
  @ApiPropertyOptional({ description: 'Busca textual (mensagem, usuário, entidade)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: LogAction, description: 'Filtrar por ação específica' })
  @IsOptional()
  @IsEnum(LogAction)
  action?: LogAction;

  @ApiPropertyOptional({ enum: LogSeverity, description: 'Filtrar por severidade' })
  @IsOptional()
  @IsEnum(LogSeverity)
  severity?: LogSeverity;

  @ApiPropertyOptional({ description: 'Filtrar por ID do usuário' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por entidade' })
  @IsOptional()
  @IsString()
  entity?: string;

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

  @ApiPropertyOptional({ description: 'Itens por página (padrão: 50, máx: 200)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}

/**
 * DTO de resposta para um log individual.
 */
export class LogResponseDto {
  id: string;
  action: LogAction;
  severity: LogSeverity;
  message: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  entity: string | null;
  entityId: string | null;
  entityName: string | null;
  details: Record<string, any> | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  url: string | null;
  method: string | null;
  statusCode: number | null;
  duration: number | null;
  createdAt: Date;
}

/**
 * DTO de resposta paginada para logs.
 */
export class LogPaginatedResponseDto {
  data: LogResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
