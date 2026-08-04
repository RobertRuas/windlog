/**
 * ============================================================================
 * SETTINGS DTO - Data Transfer Object para Preferências do Usuário
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define o schema de validação para o endpoint de atualização das
 * preferências pessoais do usuário (idioma, tema e escala).
 *
 * CAMPOS:
 * -------
 * - language: Idioma da interface (atualmente apenas "pt")
 * - theme: Tema visual ("light", "dark" ou "auto")
 * - scale: Escala da interface em percentagem (60 a 110)
 * ============================================================================
 */

import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para atualizar as preferências do usuário.
 * Todos os campos são opcionais (atualização parcial).
 */
export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: 'Idioma preferido da interface',
    example: 'pt',
  })
  @IsOptional()
  @IsString()
  @IsIn(['pt'], { message: 'Language must be one of: pt' })
  language?: string;

  @ApiPropertyOptional({
    description: 'Tema visual da interface',
    example: 'auto',
    enum: ['light', 'dark', 'auto'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'auto'], { message: 'Theme must be one of: light, dark, auto' })
  theme?: string;

  @ApiPropertyOptional({
    description: 'Escala da interface em percentagem (60 a 110)',
    example: 80,
    minimum: 60,
    maximum: 110,
  })
  @IsOptional()
  @IsInt()
  @Min(60, { message: 'Scale must be at least 60' })
  @Max(110, { message: 'Scale must be at most 110' })
  scale?: number;
}
