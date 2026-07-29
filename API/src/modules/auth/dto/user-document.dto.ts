/**
 * ============================================================================
 * USER DOCUMENT DTOs - Validação de Dados para Documentos Pessoais
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados para gerenciar documentos pessoais do usuário.
 * Contém DTOs para criar e atualizar documentos.
 *
 * DOCUMENTOS SUPORTADOS:
 * ----------------------
 * - PASSPORT:         Passaporte
 * - ID_CARD:          Cartão de identidade
 * - TAX_ID:           Número de identificação fiscal (NIF/TIN)
 * - SOCIAL_SECURITY:  Número de segurança social
 * - WORK_PERMIT:      Permissão de trabalho
 * - VISA:             Visto
 * - DRIVERS_LICENSE:  Carta de condução
 * - OTHER:            Outro documento
 *
 * VALIDAÇÕES:
 * -----------
 * - type: obrigatório (enum DocumentType)
 * - documentNumber: opcional
 * - issueDate: opcional, data válida
 * - expiryDate: opcional, data válida
 * ============================================================================
 */

import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Enum local para tipos de documento.
 * Deve ser mantido em sincronia com o schema Prisma.
 */
export enum DocumentType {
  PASSPORT = 'PASSPORT',
  ID_CARD = 'ID_CARD',
  TAX_ID = 'TAX_ID',
  SOCIAL_SECURITY = 'SOCIAL_SECURITY',
  WORK_PERMIT = 'WORK_PERMIT',
  VISA = 'VISA',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  OTHER = 'OTHER',
}

/**
 * DTO para criar um novo documento pessoal.
 */
export class CreateDocumentDto {
  @ApiProperty({
    description: 'Tipo de documento',
    enum: DocumentType,
    example: 'PASSPORT',
  })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiPropertyOptional({
    description: 'Número do documento',
    example: 'AB123456',
  })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({
    description: 'País emissor (código ISO 3166-1 alpha-2)',
    example: 'PT',
  })
  @IsOptional()
  @IsString()
  issuingCountry?: string;

  @ApiPropertyOptional({
    description: 'Data de expedição',
    example: '2020-06-15',
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Data de validade',
    example: '2030-06-15',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Descrição ou notas adicionais',
    example: 'Visto tipo D para trabalho na Alemanha',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL/caminho do ficheiro digitalizado (frente)',
    example: '/uploads/documents/passport_front.pdf',
  })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional({
    description: 'URL/caminho do ficheiro digitalizado (verso)',
    example: '/uploads/documents/passport_back.pdf',
  })
  @IsOptional()
  @IsString()
  filePathBack?: string;

  @ApiPropertyOptional({
    description: 'Nome original do ficheiro carregado',
    example: 'passaporte.pdf',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Tipo MIME do ficheiro',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  fileType?: string;
}

/**
 * DTO para atualizar um documento existente.
 * Todos os campos são opcionais.
 */
export class UpdateDocumentDto {
  @ApiPropertyOptional({ enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issuingCountry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  filePathBack?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileType?: string;
}
