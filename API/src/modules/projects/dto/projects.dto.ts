/**
 * ============================================================================
 * PROJECTS DTO - Data Transfer Objects para Gestão de Projetos
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os schemas de validação para os endpoints de gestão de projetos.
 * Usa class-validator para validar automaticamente os dados recebidos.
 *
 * DTOs DEFINIDOS:
 * ---------------
 * - CreateProjectDto: dados para criar novo projeto
 * - UpdateProjectDto: dados para atualizar projeto (todos opcionais)
 * - ProjectFilterDto: filtros para listagem de projetos
 * - CreateTurbineDto: dados para criar turbina em um projeto
 * - UpdateTurbineDto: dados para atualizar turbina
 * - AddMemberDto: dados para associar usuário ao projeto
 * ============================================================================
 */

import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

/**
 * DTO para criar novo projeto.
 * Campos obrigatórios: name, client, location
 */
export class CreateProjectDto {
  @ApiProperty({ description: 'Nome do projeto', example: 'Parque Eólico Serra do Mar' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Cliente do projeto', example: 'EDP Renewables' })
  @IsString()
  client: string;

  @ApiProperty({ description: 'Localização do projeto', example: 'Serra do Mar, Portugal' })
  @IsString()
  location: string;

  @ApiPropertyOptional({ description: 'Escopo do projeto', example: 'Manutenção preventiva' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada do projeto' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Latitude do centro do projeto', example: 38.7167 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude do centro do projeto', example: -9.1333 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Data de início do projeto', example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Status do projeto', enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
  status?: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
}

/**
 * DTO para atualizar projeto.
 * Todos os campos são opcionais.
 */
export class UpdateProjectDto {
  @ApiPropertyOptional({ description: 'Nome do projeto' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Cliente do projeto' })
  @IsOptional()
  @IsString()
  client?: string;

  @ApiPropertyOptional({ description: 'Localização do projeto' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Escopo do projeto' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Status do projeto', enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
  status?: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
}

/**
 * DTO para filtrar listagem de projetos.
 * Estende PaginationDto com campos de busca.
 */
export class ProjectFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou cliente' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por status', enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
  status?: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
}

/**
 * DTO para criar turbina em um projeto.
 * Campo obrigatório: name
 */
export class CreateTurbineDto {
  @ApiProperty({ description: 'Nome/identificação da turbina', example: 'T-001' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Localização da turbina' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Fabricante', example: 'Vestas' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Modelo da turbina', example: 'V100-1.8 MW' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Altura do nacelle (metros)', example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nacelleHeight?: number;

  @ApiPropertyOptional({ description: 'Latitude da turbina', example: 38.72 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude da turbina', example: -9.13 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Status da turbina', enum: ['OPERATIONAL', 'MAINTENANCE', 'OFFLINE', 'DECOMMISSIONED'] })
  @IsOptional()
  @IsEnum(['OPERATIONAL', 'MAINTENANCE', 'OFFLINE', 'DECOMMISSIONED'])
  status?: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE' | 'DECOMMISSIONED';
}

/**
 * DTO para atualizar turbina.
 * Todos os campos são opcionais.
 */
export class UpdateTurbineDto {
  @ApiPropertyOptional({ description: 'Nome da turbina' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Localização' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Fabricante' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Modelo' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Altura do nacelle (metros)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  nacelleHeight?: number;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Status da turbina', enum: ['OPERATIONAL', 'MAINTENANCE', 'OFFLINE', 'DECOMMISSIONED'] })
  @IsOptional()
  @IsEnum(['OPERATIONAL', 'MAINTENANCE', 'OFFLINE', 'DECOMMISSIONED'])
  status?: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE' | 'DECOMMISSIONED';
}

/**
 * DTO para associar usuário (membro) a um projeto.
 * Campo obrigatório: userId
 */
export class AddMemberDto {
  @ApiProperty({ description: 'ID do usuário a ser associado ao projeto' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Função do membro no projeto', example: 'Lead Technician' })
  @IsOptional()
  @IsString()
  role?: string;
}
