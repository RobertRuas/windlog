/**
 * ============================================================================
 * TIMESHEET FILTER DTO - Filtros para Listagem de Weekly Timesheets
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os filtros disponíveis para listar timesheets na API.
 * Permite filtrar por projeto, semana, status e usuário criador.
 *
 * FILTROS DISPONÍVEIS:
 * --------------------
 * - projectId:  filtra por projeto específico
 * - week:       filtra por número da semana
 * - status:     filtra por status (DRAFT, SUBMITTED, APPROVED)
 * - createdBy:  filtra por usuário criador (Team Leader)
 * ============================================================================
 */

import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

/**
 * DTO para filtrar a listagem de Weekly Timesheets.
 * Estende PaginationDto para suportar paginação automática.
 */
export class TimesheetFilterDto extends PaginationDto {
  /** Filtrar por projeto específico */
  @ApiPropertyOptional({ description: 'ID do projeto vinculado' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  /** Filtrar por número da semana ISO */
  @ApiPropertyOptional({ description: 'Número da semana', example: '26' })
  @IsOptional()
  @IsString()
  week?: string;

  /** Filtrar por status do timesheet */
  @ApiPropertyOptional({
    description: 'Status do timesheet',
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED'],
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'SUBMITTED', 'APPROVED'])
  status?: string;

  /** Filtrar por usuário criador (Team Leader) */
  @ApiPropertyOptional({ description: 'ID do usuário que criou o timesheet' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
