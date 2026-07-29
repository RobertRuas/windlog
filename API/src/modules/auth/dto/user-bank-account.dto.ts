/**
 * ============================================================================
 * USER BANK ACCOUNT DTOs - Validação de Dados para Contas Bancárias
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados para gerenciar contas bancárias do usuário.
 * Contém DTOs para criar e atualizar contas bancárias.
 *
 * VALIDAÇÕES:
 * -----------
 * - bankName: obrigatório
 * - iban: obrigatório
 * - accountHolder: obrigatório
 * - bicSwift: opcional
 * - isPrimary: opcional (default: false)
 * - description: opcional
 * ============================================================================
 */

import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para criar uma nova conta bancária.
 */
export class CreateBankAccountDto {
  @ApiProperty({
    description: 'Nome do banco',
    example: 'Millennium BCP',
  })
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @ApiProperty({
    description: 'IBAN (International Bank Account Number)',
    example: 'PT50 0002 0123 12345678901 23',
  })
  @IsNotEmpty()
  @IsString()
  iban: string;

  @ApiPropertyOptional({
    description: 'Código BIC/SWIFT',
    example: 'BESCPTPL',
  })
  @IsOptional()
  @IsString()
  bicSwift?: string;

  @ApiProperty({
    description: 'Nome completo do titular da conta',
    example: 'João Manuel Silva',
  })
  @IsNotEmpty()
  @IsString()
  accountHolder: string;

  @ApiPropertyOptional({
    description: 'Se é a conta principal do usuário',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Descrição opcional da conta',
    example: 'Conta salário',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO para atualizar uma conta bancária existente.
 * Todos os campos são opcionais.
 */
export class UpdateBankAccountDto {
  @ApiPropertyOptional({
    description: 'Nome do banco',
    example: 'Millennium BCP',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    description: 'IBAN',
    example: 'PT50 0002 0123 12345678901 23',
  })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional({
    description: 'Código BIC/SWIFT',
    example: 'BESCPTPL',
  })
  @IsOptional()
  @IsString()
  bicSwift?: string;

  @ApiPropertyOptional({
    description: 'Nome completo do titular da conta',
    example: 'João Manuel Silva',
  })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiPropertyOptional({
    description: 'Se é a conta principal do usuário',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Descrição opcional da conta',
    example: 'Conta salário',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
