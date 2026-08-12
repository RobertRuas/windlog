/**
 * ============================================================================
 * DOCUMENT FILTER DTO - Filtros para Listagem de Documentos
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os parâmetros de filtro e paginação para a listagem de documentos.
 * Usado no endpoint GET /documents para filtrar resultados.
 *
 * FILTROS DISPONÍVEIS:
 * --------------------
 * - templateId: filtrar por tipo de template
 * - status:     filtrar por status (DRAFT, SIGNED, FINAL)
 * - page:       número da página (padrão: 1)
 * - limit:      itens por página (padrão: 10)
 * ============================================================================
 */

import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para filtrar e paginar a listagem de documentos.
 */
export class DocumentFilterDto {
  /**
   * Filtrar por tipo de template.
   */
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de template',
    example: 'invoice',
  })
  @IsOptional()
  @IsString()
  templateId?: string;

  /**
   * Filtrar por status do documento.
   */
  @ApiPropertyOptional({
    description: 'Filtrar por status (DRAFT, SIGNED, FINAL)',
    example: 'DRAFT',
  })
  @IsOptional()
  @IsString()
  status?: string;

  /**
   * Número da página para paginação.
   * Padrão: 1
   */
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Quantidade de itens por página.
   * Padrão: 10
   */
  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
