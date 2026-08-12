/**
 * ============================================================================
 * CREATE DOCUMENT DTO - Validação para Criação de Documento Gerado
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os campos obrigatórios e opcionais para criar um novo documento
 * gerado a partir de template. Usa class-validator para validar
 * automaticamente os dados recebidos na API.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. O usuário seleciona um template e preenche o formulário
 * 2. O backend valida os campos e cria o documento com versão 1
 * 3. Os dados do formulário são armazenados como JSON (formData)
 *
 * CAMPOS OBRIGATÓRIOS:
 * --------------------
 * - templateId: ID do template (ex: "invoice", "car-daily-report")
 * - title:      Título exibível do documento
 * - formData:   JSON com os dados do formulário
 *
 * CAMPOS OPCIONAIS:
 * -----------------
 * - signatureData: Dados da assinatura em base64
 * - signedBy:      Nome de quem assinou
 * ============================================================================
 */

import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para criar novo documento gerado.
 *
 * O documento é criado com versão 1 automaticamente.
 * Os dados do formulário são armazenados como JSON.
 */
export class CreateGeneratedDocumentDto {
  /**
   * ID do template ao qual este documento será vinculado.
   * Obrigatório — define qual template HTML/SVG será usado.
   */
  @ApiProperty({
    description: 'ID do template (ex: "invoice", "car-daily-report", "toolbox-talk")',
    example: 'invoice',
  })
  @IsString()
  templateId: string;

  /**
   * Título exibível do documento.
   * Obrigatório — usado na listagem e visualização.
   */
  @ApiProperty({
    description: 'Título exibível do documento',
    example: 'Invoice #001 - Nordic Access',
  })
  @IsString()
  title: string;

  /**
   * JSON com os dados preenchidos no formulário.
   * Obrigatório — estrutura varia por template.
   */
  @ApiProperty({
    description: 'JSON com os dados do formulário (estrutura varia por template)',
    example: { invoiceNumber: '001', clientName: 'Nordic Access', total: 1512.00 },
  })
  @IsObject()
  formData: Record<string, any>;

  /**
   * Dados da assinatura em base64 PNG.
   * Opcional — pode ser adicionado posteriormente.
   */
  @ApiPropertyOptional({
    description: 'Dados da assinatura em base64 PNG',
  })
  @IsOptional()
  @IsString()
  signatureData?: string;

  /**
   * Nome de quem assinou o documento.
   * Opcional — pode ser adicionado posteriormente.
   */
  @ApiPropertyOptional({
    description: 'Nome de quem assinou',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  signedBy?: string;
}
