/**
 * ============================================================================
 * FEEDBACK FILTER DTO - Filtros para Listagem de Feedbacks
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os filtros disponíveis para listar feedbacks na API.
 * Permite filtrar por categoria, status, prioridade e usuário.
 *
 * FILTROS DISPONÍVEIS:
 * --------------------
 * - category:  filtra por categoria (BUG, UI_ISSUE, FEATURE, etc.)
 * - status:    filtra por status (NEW, TRIAGED, IN_PROGRESS, etc.)
 * - priority:  filtra por prioridade (LOW, MEDIUM, HIGH, CRITICAL)
 * - search:    busca textual no título e descrição
 * ============================================================================
 */

import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

/**
 * DTO para filtrar a listagem de Feedbacks.
 * Estende PaginationDto para suportar paginação automática.
 */
export class FeedbackFilterDto extends PaginationDto {
  /** Filtrar por categoria do feedback */
  @ApiPropertyOptional({
    description: 'Categoria do feedback',
    enum: ['BUG', 'UI_ISSUE', 'FEATURE', 'INCONSISTENCY', 'PERFORMANCE', 'OTHER'],
  })
  @IsOptional()
  @IsEnum(['BUG', 'UI_ISSUE', 'FEATURE', 'INCONSISTENCY', 'PERFORMANCE', 'OTHER'])
  category?: string;

  /** Filtrar por status do feedback */
  @ApiPropertyOptional({
    description: 'Status do feedback',
    enum: ['NEW', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  })
  @IsOptional()
  @IsEnum(['NEW', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status?: string;

  /** Filtrar por prioridade do feedback */
  @ApiPropertyOptional({
    description: 'Prioridade do feedback',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  priority?: string;

  /** Busca textual no título e descrição */
  @ApiPropertyOptional({
    description: 'Busca textual no título e descrição',
    example: 'botão salvar',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
