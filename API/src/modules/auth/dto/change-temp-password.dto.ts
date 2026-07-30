/**
 * ============================================================================
 * CHANGE TEMP PASSWORD DTO - Validação de Dados para Troca de Senha Temporária
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados enviados pelo frontend para trocar a senha
 * temporária (gerada pelo admin) por uma nova senha definitiva.
 *
 * VALIDAÇÕES:
 * -----------
 * - newPassword: obrigatório, mínimo 6 caracteres
 *
 * EXEMPLO DE REQUISIÇÃO:
 * ----------------------
 * POST /api/v1/auth/change-temp-password
 * {
 *   "newPassword": "minhaNovaSenha123"
 * }
 * ============================================================================
 */

import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para o endpoint de troca de senha temporária.
 * Valida automaticamente os dados recebidos na requisição.
 */
export class ChangeTempPasswordDto {
  @ApiProperty({
    description: 'Nova senha escolhida pelo usuário (mínimo 6 caracteres)',
    example: 'minhaNovaSenha123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword: string;
}
