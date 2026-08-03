/**
 * ============================================================================
 * UPDATE PROFILE DTO - Validação de Dados para Atualização do Perfil
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados enviados pelo frontend para atualizar o perfil.
 * Todos os campos são opcionais (PartialType), permitindo atualizações parciais.
 *
 * VALIDAÇÕES:
 * -----------
 * - firstName: mínimo 2 caracteres (se fornecido)
 * - lastName: mínimo 2 caracteres (se fornecido)
 * - phone: formato válido (se fornecido)
 * - dateOfBirth: data válida (se fornecido)
 * - email: formato de e-mail válido (se fornecido)
 *
 * EXEMPLO DE REQUISIÇÃO:
 * ----------------------
 * PUT /api/v1/auth/profile
 * {
 *   "firstName": "João",
 *   "department": "Operações",
 *   "phone": "+351912345678"
 * }
 * ============================================================================
 */

import { IsString, IsOptional, IsEmail, MinLength, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para o endpoint de atualização de perfil.
 * Todos os campos são opcionais (PartialType).
 */
export class UpdateProfileDto {
  @ApiProperty({
    description: 'Primeiro nome do usuário',
    example: 'João',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  firstName?: string;

  @ApiProperty({
    description: 'Sobrenome do usuário',
    example: 'Silva',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  lastName?: string;

  @ApiProperty({
    description: 'Número de telefone principal',
    example: '+351912345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Código do país do telefone',
    example: '+351',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneCountryCode?: string;

  @ApiProperty({
    description: 'Data de nascimento',
    example: '1990-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Nacionalidade (código do país)',
    example: 'PT',
    required: false,
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({
    description: 'Endereço',
    example: 'Rua das Flores, 123',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'Lisboa',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Código postal',
    example: '1000-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({
    description: 'País',
    example: 'Portugal',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'Departamento',
    example: 'Operações',
    required: false,
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    description: 'Cargo/função profissional',
    example: 'Técnico de Turbinas Eólicas',
    required: false,
  })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({
    description: 'Data de contratação',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Hire date must be a valid date' })
  hireDate?: string;

  @ApiProperty({
    description: 'Biografia/resumo profissional',
    example: 'Profissional com 10 anos de experiência em energia eólica.',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: 'URL da foto do usuário',
    example: '/uploads/photos/user-123.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty({
    description: 'Dados da assinatura do usuário (base64 PNG). Enviar null para remover.',
    example: 'data:image/png;base64,iVBORw0KGgo...',
    required: false,
  })
  @IsOptional()
  @IsString()
  signatureData?: string | null;
}
