/**
 * ============================================================================
 * USER LANGUAGE DTOs - Validação de Dados para Idiomas
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados para gerenciar idiomas do usuário.
 * Contém DTOs para criar e atualizar idiomas.
 *
 * VALIDAÇÕES:
 * -----------
 * - language: obrigatório (nome do idioma)
 * - level: obrigatório (A1, A2, B1, B2, C1, C2, NATIVE)
 * ============================================================================
 */

import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LanguageLevel } from '../../../prisma/generated/prisma/client.js';

/**
 * DTO para criar um novo idioma.
 */
export class CreateLanguageDto {
  @ApiProperty({ description: 'Nome do idioma', example: 'English' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({ description: 'Nível de proficiência', enum: LanguageLevel })
  @IsEnum(LanguageLevel)
  level: LanguageLevel;
}

/**
 * DTO para atualizar um idioma existente.
 */
export class UpdateLanguageDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  language?: string;

  @ApiProperty({ required: false, enum: LanguageLevel })
  @IsEnum(LanguageLevel)
  level?: LanguageLevel;
}
