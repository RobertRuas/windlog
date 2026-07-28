/**
 * ============================================================================
 * PAGINATION DTO - DTO Base para Paginação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os parâmetros de paginação que podem ser usados em QUALQUER
 * endpoint de listagem da API.
 *
 * POR QUE PRECISAMOS DISSO?
 * -------------------------
 * - Evita duplicação: todos os módulos usam a mesma paginação
 * - Validação automática: class-validator valida os parâmetros
 * - Documentação: o Swagger mostra os parâmetros automaticamente
 *
 * COMO USAR?
 * ----------
 * No controller do módulo:
 * @Get()
 * findAll(@Query() pagination: PaginationDto) {
 *   return this.service.findAll(pagination);
 * }
 *
 * EXEMPLO DE USO:
 * ---------------
 * GET /api/v1/users?page=1&limit=10&sortBy=createdAt&orderBy=desc
 * ============================================================================
 */

import { IsOptional, IsInt, IsString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de paginação reutilizável por todos os módulos.
 *
 * Todos os campos são opcionais e têm valores padrão:
 * - page: página atual (padrão: 1)
 * - limit: itens por página (padrão: 10, máximo: 100)
 * - sortBy: campo para ordenação
 * - orderBy: direção da ordenação (asc ou desc)
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Número da página (começa em 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number) // Transforma string da URL em número
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Limita para evitar queries pesadas
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Campo para ordenação (ex: createdAt, name)',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    default: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsIn(['asc', 'desc']) // Apenas 'asc' ou 'desc' são válidos
  orderBy: 'asc' | 'desc' = 'desc';

  /**
   * Calcula o offset (quantos registros pular).
   * Usado internamente pelo Prisma para paginação.
   *
   * Exemplo: page=3, limit=10 → skip = 20 (pula os 20 primeiros)
   */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
