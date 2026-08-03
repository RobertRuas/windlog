/**
 * ============================================================================
 * USER CERTIFICATION DTOs - Validação de Dados para Certificações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados para gerenciar certificações do usuário.
 * Contém DTOs para criar e atualizar certificações.
 *
 * VALIDAÇÕES:
 * -----------
 * - name: obrigatório
 * - issuer: obrigatório
 * - type: obrigatório (CERTIFICATION, DIPLOMA, COURSE, TRAINING, LICENSE)
 * - issueDate: obrigatório, data válida
 * - expiryDate: opcional, data válida
 * ============================================================================
 */

import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum local para tipos de certificação.
 * Deve ser mantido em sincronia com o schema Prisma.
 */
export enum CertificationType {
  CERTIFICATION = 'CERTIFICATION',
  DIPLOMA = 'DIPLOMA',
  COURSE = 'COURSE',
  TRAINING = 'TRAINING',
  LICENSE = 'LICENSE',
}

/**
 * DTO para criar uma nova certificação.
 */
export class CreateCertificationDto {
  @ApiProperty({ description: 'Nome da certificação', example: 'GWO BST' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Entidade emissora', example: 'GWO' })
  @IsString()
  @IsNotEmpty()
  issuer: string;

  @ApiProperty({ description: 'Tipo de certificação', enum: CertificationType })
  @IsEnum(CertificationType)
  type: CertificationType;

  @ApiProperty({ description: 'Descrição detalhada', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Número da certificação', required: false })
  @IsOptional()
  @IsString()
  certNumber?: string;

  @ApiProperty({ description: 'Data de expedição', example: '2024-01-15' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ description: 'Data de expiração', required: false })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({
    description: 'Caminho do ficheiro anexado (foto ou PDF da certificação)',
    required: false,
  })
  @IsOptional()
  @IsString()
  filePath?: string;
}

/**
 * DTO para atualizar uma certificação existente.
 */
export class UpdateCertificationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  issuer?: string;

  @ApiProperty({ required: false, enum: CertificationType })
  @IsOptional()
  @IsEnum(CertificationType)
  type?: CertificationType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  certNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({
    description: 'Caminho do ficheiro anexado (null remove o anexo)',
    required: false,
  })
  @IsOptional()
  @IsString()
  filePath?: string | null;
}
