/**
 * ============================================================================
 * DEV LOGIN DTO - Validação de Dados para Login Automático (DESENVOLVIMENTO)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados enviados pelo frontend para o login automático
 * de desenvolvimento (sem senha), usado pelo dropdown de troca rápida de
 * usuário na tela de login.
 *
 * ⚠️ IMPORTANTE (SEGURANÇA):
 * ---------------------------
 * Este DTO alimenta um endpoint que SÓ funciona quando NODE_ENV é
 * "development". Em produção o endpoint correspondente retorna 404 e
 * nunca emite tokens. Portanto, ele serve apenas para acelerar o
 * trabalho de desenvolvimento local.
 *
 * VALIDAÇÕES:
 * -----------
 * - email: obrigatório, formato válido
 *
 * EXEMPLO DE REQUISIÇÃO:
 * ----------------------
 * POST /api/v1/auth/dev-login
 * {
 *   "email": "user@example.com"
 * }
 * ============================================================================
 */

import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para o endpoint de login automático de desenvolvimento.
 * Valida automaticamente os dados recebidos na requisição.
 */
export class DevLoginDto {
  @ApiProperty({
    description: 'E-mail do usuário cadastrado que receberá a sessão de desenvolvimento',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255)
  email: string;
}
