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

import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum local para níveis de proficiência em idiomas.
 * Deve ser mantido em sincronia com o schema Prisma.
 */
export enum LanguageLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
  NATIVE = 'NATIVE',
}

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
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  language?: string;

  @ApiProperty({ required: false, enum: LanguageLevel })
  @IsOptional()
  @IsEnum(LanguageLevel)
  level?: LanguageLevel;
}
