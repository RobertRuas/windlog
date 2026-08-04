/**
 * ============================================================================
 * USER PPE DTOs - Validação de Dados para EPIs (Equipamentos de Proteção Individual)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define e valida os dados para gerenciar os EPIs do usuário.
 * Contém DTOs para criar e atualizar equipamentos de proteção individual.
 *
 * VALIDAÇÕES:
 * -----------
 * - name: obrigatório (nome/descrição do EPI)
 * - type: obrigatório (HARNESS, HELMET, ROPE, FALL_ARREST, etc.)
 * - category: opcional, padrão COMPANY_PROVIDED
 * - condition: opcional, padrão GOOD
 * - serialNumber, brand, model: opcionais (identificação do equipamento)
 * - purchaseDate, lastInspectionDate, nextInspectionDate: opcionais, datas válidas
 * ============================================================================
 */

import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Enum local para categorias de EPI.
 * Deve ser mantido em sincronia com o schema Prisma.
 */
export enum PpeCategory {
  COMPANY_PROVIDED = 'COMPANY_PROVIDED',  // Fornecido pela empresa
  PERSONAL = 'PERSONAL',                  // Pessoal do trabalhador
}

/**
 * Enum local para tipos de EPI.
 * Equipamentos comuns em energia eólica e acesso por cordas na Europa.
 */
export enum PpeType {
  HARNESS = 'HARNESS',                    // Arnês de segurança
  HELMET = 'HELMET',                      // Capacete
  ROPE = 'ROPE',                          // Corda
  FALL_ARREST = 'FALL_ARREST',            // Dispositivo anticaída
  GLOVES = 'GLOVES',                      // Luvas de proteção
  FOOTWEAR = 'FOOTWEAR',                  // Calçado de segurança
  EYE_PROTECTION = 'EYE_PROTECTION',      // Proteção ocular
  RESPIRATORY = 'RESPIRATORY',            // Proteção respiratória
  ANCHOR_CONNECTOR = 'ANCHOR_CONNECTOR',  // Anchor e conectores
  FIRST_AID = 'FIRST_AID',               // Kit de primeiros socorros
  OTHER = 'OTHER',                        // Outro EPI
}

/**
 * Enum local para condição/estado do EPI.
 */
export enum PpeCondition {
  NEW = 'NEW',                            // Novo (sem uso)
  GOOD = 'GOOD',                          // Bom estado (apto para uso)
  FAIR = 'FAIR',                          // Estado razoável (monitorar)
  NEEDS_REPLACEMENT = 'NEEDS_REPLACEMENT',// Precisa ser substituído
  EXPIRED = 'EXPIRED',                    // Expirado (validade vencida)
  RETIRED = 'RETIRED',                    // Aposentado (fora de circulação)
}

/**
 * DTO para criar um novo EPI.
 *
 * Campos obrigatórios: name e type.
 * Todos os demais campos são opcionais.
 */
export class CreatePpeDto {
  /**
   * Nome/descrição do EPI.
   * Ex: "Arnês de segurança", "Capacete de proteção"
   */
  @ApiProperty({
    description: 'Nome/descrição do EPI',
    example: 'Arnês de segurança',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Categoria do EPI (origem: empresa ou pessoal).
   * Padrão: COMPANY_PROVIDED.
   */
  @ApiPropertyOptional({
    description: 'Categoria do EPI (origem)',
    enum: PpeCategory,
    default: PpeCategory.COMPANY_PROVIDED,
  })
  @IsOptional()
  @IsEnum(PpeCategory)
  category?: PpeCategory;

  /**
   * Tipo do EPI (classificação do equipamento).
   * Obrigatório — define o tipo de proteção.
   */
  @ApiProperty({
    description: 'Tipo do EPI',
    enum: PpeType,
    example: PpeType.HARNESS,
  })
  @IsEnum(PpeType)
  type: PpeType;

  /**
   * Marca do fabricante.
   * Ex: "Petzl", "Beal", "Camp", "Kong", "Singing Rock"
   */
  @ApiPropertyOptional({
    description: 'Marca do fabricante',
    example: 'Petzl',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  /**
   * Modelo do equipamento.
   * Ex: "AVAO BOD", "VERTEX BEST", "ANTIPODES 10.5"
   */
  @ApiPropertyOptional({
    description: 'Modelo do equipamento',
    example: 'AVAO BOD',
  })
  @IsOptional()
  @IsString()
  model?: string;

  /**
   * Número de série / ID único do equipamento.
   * Importante para rastreabilidade e inspeções.
   */
  @ApiPropertyOptional({
    description: 'Número de série do equipamento',
    example: 'PZ-2024-001',
  })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  /**
   * Data de aquisição/compra do equipamento.
   */
  @ApiPropertyOptional({
    description: 'Data de aquisição',
    example: '2024-03-15',
  })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  /**
   * Data da última inspeção realizada.
   */
  @ApiPropertyOptional({
    description: 'Data da última inspeção',
    example: '2025-01-10',
  })
  @IsOptional()
  @IsDateString()
  lastInspectionDate?: string;

  /**
   * Data da próxima inspeção obrigatória.
   * Usada para gerar alertas de vencimento.
   */
  @ApiPropertyOptional({
    description: 'Data da próxima inspeção obrigatória',
    example: '2026-01-10',
  })
  @IsOptional()
  @IsDateString()
  nextInspectionDate?: string;

  /**
   * Condição atual do EPI.
   * Padrão: GOOD.
   */
  @ApiPropertyOptional({
    description: 'Condição atual do EPI',
    enum: PpeCondition,
    default: PpeCondition.GOOD,
  })
  @IsOptional()
  @IsEnum(PpeCondition)
  condition?: PpeCondition;

  /**
   * Observações/notas sobre o equipamento.
   * Ex: "Inspeção feita em Jan/2025", "Trocar mosquetão em 6 meses"
   */
  @ApiPropertyOptional({
    description: 'Observações sobre o equipamento',
    example: 'Inspeção visual realizada antes de cada uso',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Caminho do ficheiro anexado (certificado de inspeção, foto, etc.).
   */
  @ApiPropertyOptional({
    description: 'Caminho do ficheiro anexado (foto ou certificado)',
  })
  @IsOptional()
  @IsString()
  filePath?: string;
}

/**
 * DTO para atualizar um EPI existente.
 * Todos os campos são opcionais (atualização parcial).
 */
export class UpdatePpeDto {
  @ApiPropertyOptional({ description: 'Nome/descrição do EPI' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Categoria do EPI', enum: PpeCategory })
  @IsOptional()
  @IsEnum(PpeCategory)
  category?: PpeCategory;

  @ApiPropertyOptional({ description: 'Tipo do EPI', enum: PpeType })
  @IsOptional()
  @IsEnum(PpeType)
  type?: PpeType;

  @ApiPropertyOptional({ description: 'Marca do fabricante' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Modelo do equipamento' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Número de série' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Data de aquisição' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: 'Data da última inspeção' })
  @IsOptional()
  @IsDateString()
  lastInspectionDate?: string;

  @ApiPropertyOptional({ description: 'Data da próxima inspeção' })
  @IsOptional()
  @IsDateString()
  nextInspectionDate?: string;

  @ApiPropertyOptional({ description: 'Condição atual do EPI', enum: PpeCondition })
  @IsOptional()
  @IsEnum(PpeCondition)
  condition?: PpeCondition;

  @ApiPropertyOptional({ description: 'Observações sobre o equipamento' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Caminho do ficheiro anexado (null remove o anexo)',
  })
  @IsOptional()
  @IsString()
  filePath?: string | null;
}
