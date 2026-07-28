/**
 * ============================================================================
 * LOGIN DTO - Validação de Dados para Login
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados enviados pelo frontend para fazer login.
 *
 * VALIDAÇÕES:
 * -----------
 * - email: obrigatório, formato válido
 * - password: obrigatório, mínimo 6 caracteres
 *
 * EXEMPLO DE REQUISIÇÃO:
 * ----------------------
 * POST /api/v1/auth/login
 * {
 *   "email": "user@example.com",
 *   "password": "minhasenha123"
 * }
 * ============================================================================
 */

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para o endpoint de login.
 * Valida automaticamente os dados recebidos na requisição.
 */
export class LoginDto {
  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'minhasenha123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
