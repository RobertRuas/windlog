/**
 * ============================================================================
 * REGISTER DTO - Validação de Dados para Registro de Usuário
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados enviados pelo frontend para registrar um
 * novo usuário no sistema.
 *
 * VALIDAÇÕES:
 * -----------
 * - email: obrigatório, formato válido
 * - password: obrigatório, mínimo 6 caracteres
 * - firstName: obrigatório
 * - lastName: obrigatório
 * - role: opcional (padrão: TECHNICIAN)
 *
 * EXEMPLO DE REQUISIÇÃO:
 * ----------------------
 * POST /api/v1/auth/register
 * {
 *   "email": "user@example.com",
 *   "password": "minhasenha123",
 *   "firstName": "John",
 *   "lastName": "Doe"
 * }
 * ============================================================================
 */

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/decorators/roles.decorator.js';

/**
 * DTO para o endpoint de registro.
 * Valida automaticamente os dados recebidos na requisição.
 */
export class RegisterDto {
  @ApiProperty({
    description: 'E-mail do usuário (deve ser único)',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: 'minhasenha123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({
    description: 'Primeiro nome do usuário',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    description: 'Sobrenome do usuário',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Papel do usuário no sistema (padrão: TECHNICIAN)',
    enum: Role,
    default: Role.TECHNICIAN,
  })
  @IsOptional()
  @IsEnum(Role, {
    message: `Role must be one of: ${Object.values(Role).join(', ')}`,
  })
  role?: Role;
}
