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
 * CAMPOS OBRIGATÓRIOS (apenas no cadastro inicial):
 * - email, password, firstName, lastName
 *
 * CAMPOS OPCIONAIS (preenchidos posteriormente no perfil):
 * - phone, phoneCountryCode, dateOfBirth, nationality
 * - department, position, englishLevel
 * - role (padrão: STANDARD)
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
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/decorators/roles.decorator.js';

/**
 * DTO para o endpoint de registro.
 * Valida automaticamente os dados recebidos na requisição.
 *
 * Apenas email, password, firstName e lastName são obrigatórios.
 * Os demais campos podem ser preenchidos posteriormente no perfil.
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
    description: 'Papel do usuário no sistema (padrão: STANDARD)',
    enum: Role,
    default: Role.STANDARD,
  })
  @IsOptional()
  @IsEnum(Role, {
    message: `Role must be one of: ${Object.values(Role).join(', ')}`,
  })
  role?: Role;

  // =========================================================================
  // CAMPOS OPCIONAIS (preenchidos posteriormente)
  // =========================================================================

  @ApiPropertyOptional({
    description: 'Número de telefone principal (formato internacional)',
    example: '+351912345678',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Código do país do telefone (ex: "+351", "+33", "+49")',
    example: '+351',
  })
  @IsString()
  @IsOptional()
  phoneCountryCode?: string;

  @ApiPropertyOptional({
    description: 'Data de nascimento (formato ISO 8601)',
    example: '1990-05-15',
  })
  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Nacionalidade (código ISO 3166-1 alpha-2, ex: "PT", "FR")',
    example: 'PT',
  })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Departamento (ex: "Operations", "Maintenance")',
    example: 'Operations',
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({
    description: 'Cargo/função (ex: "Wind Turbine Technician")',
    example: 'Wind Turbine Technician',
  })
  @IsString()
  @IsOptional()
  position?: string;
}
