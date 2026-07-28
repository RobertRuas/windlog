/**
 * ============================================================================
 * USER PHONE DTOs - Validação de Dados para Números de Telefone
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados para gerenciar números de telefone do usuário.
 * Contém DTOs para criar e atualizar números de telefone.
 *
 * VALIDAÇÕES:
 * -----------
 * - countryCode: obrigatório, formato + seguido de números
 * - number: obrigatório
 * - type: obrigatório (mobile, home, work)
 * ============================================================================
 */

import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para criar um novo número de telefone.
 */
export class CreatePhoneDto {
  @ApiProperty({ description: 'Código do país', example: '+351' })
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty({ description: 'Número de telefone', example: '912345678' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ description: 'Tipo do número', example: 'mobile', enum: ['mobile', 'home', 'work'] })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Se é o número principal', required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

/**
 * DTO para atualizar um número de telefone existente.
 */
export class UpdatePhoneDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
