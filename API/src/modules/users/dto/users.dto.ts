/**
 * ============================================================================
 * USERS DTO - Data Transfer Objects para Gestão de Usuários
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os schemas de validação para os endpoints de gestão de usuários.
 * Usa class-validator para validar automaticamente os dados recebidos.
 *
 * DTOs DEFINIDOS:
 * ---------------
 * - CreateUserDto: dados para criar novo usuário
 * - UpdateUserDto: dados para atualizar usuário (todos opcionais)
 * - UserFilterDto: filtros para listagem de usuários
 * ============================================================================
 */

import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsIn,
} from 'class-validator';
// MinLength ainda usado no UpdateUserDto
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

/**
 * Lista restritiva de cargos/funções permitidos.
 * Deve ser mantida em sincronia com src/constants/functions.ts do frontend.
 */
const ALLOWED_POSITIONS = [
  'Administrador',
  'Recursos Humanos',
  'Gerente de Projetos',
  'Gerente de Site',
  'Team Leader',
  'Team Leader (L3)',
  'L1',
  'L2',
  'L3',
] as const;

/**
 * DTO para criar novo usuário.
 * Campos obrigatórios: email, firstName, lastName
 * A senha é gerada automaticamente pelo sistema (temporária).
 */
export class CreateUserDto {
  @ApiProperty({ description: 'Email do usuário', example: 'user@windlog.com' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @ApiProperty({ description: 'Primeiro nome', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Sobrenome', example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Role (ADMIN, HR, STANDARD)', enum: ['ADMIN', 'HR', 'STANDARD'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'HR', 'STANDARD'], { message: 'Role must be ADMIN, HR, or STANDARD' })
  role?: 'ADMIN' | 'HR' | 'STANDARD';

  @ApiPropertyOptional({ description: 'Telefone', example: '+351912345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Código do país', example: '+351' })
  @IsOptional()
  @IsString()
  phoneCountryCode?: string;

  @ApiPropertyOptional({ description: 'Nacionalidade (código ISO)', example: 'PT' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ description: 'Departamento', example: 'Operations' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Cargo (restrito à lista predefinida)', enum: ALLOWED_POSITIONS })
  @IsOptional()
  @IsIn(ALLOWED_POSITIONS, { message: `Position must be one of: ${ALLOWED_POSITIONS.join(', ')}` })
  position?: string;

  @ApiPropertyOptional({ description: 'Indica se o usuário é Team Leader', example: false })
  @IsOptional()
  @IsBoolean()
  isTeamLeader?: boolean;
}

/**
 * DTO para atualizar usuário.
 * Todos os campos são opcionais.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Senha (mínimo 6 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'Primeiro nome' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Sobrenome' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Role', enum: ['ADMIN', 'HR', 'STANDARD'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'HR', 'STANDARD'])
  role?: 'ADMIN' | 'HR' | 'STANDARD';

  @ApiPropertyOptional({ description: 'Ativo/Inativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Telefone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Código do país' })
  @IsOptional()
  @IsString()
  phoneCountryCode?: string;

  @ApiPropertyOptional({ description: 'Nacionalidade' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ description: 'Departamento' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Cargo (restrito à lista predefinida)', enum: ALLOWED_POSITIONS })
  @IsOptional()
  @IsIn(ALLOWED_POSITIONS, { message: `Position must be one of: ${ALLOWED_POSITIONS.join(', ')}` })
  position?: string;

  @ApiPropertyOptional({ description: 'Indica se o usuário é Team Leader' })
  @IsOptional()
  @IsBoolean()
  isTeamLeader?: boolean;
}

/**
 * DTO para filtrar listagem de usuários.
 * Estende PaginationDto com campos de busca.
 */
export class UserFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por role', enum: ['ADMIN', 'HR', 'STANDARD'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'HR', 'STANDARD'])
  role?: 'ADMIN' | 'HR' | 'STANDARD';

  @ApiPropertyOptional({ description: 'Filtrar por status ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
