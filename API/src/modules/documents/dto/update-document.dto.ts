/**
 * ============================================================================
 * UPDATE DOCUMENT DTO - Validação para Atualização de Documento Gerado
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os campos que podem ser atualizados em um documento existente.
 * Ao atualizar, uma nova versão é criada automaticamente (versionamento).
 *
 * COMO FUNCIONA?
 * --------------
 * 1. O usuário edita o documento e submite as alterações
 * 2. O backend valida os campos e cria uma nova versão
 * 3. A versão anterior é mantida (não sobrescrita)
 *
 * TODOS OS CAMPOS SÃO OPCIONAIS:
 * ------------------------------
 * Apenas os campos enviados são atualizados.
 * ============================================================================
 */

import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para atualizar documento gerado.
 *
 * Ao atualizar, uma nova versão é criada automaticamente.
 * Apenas os campos enviados são aplicados.
 */
export class UpdateGeneratedDocumentDto {
  /**
   * Título exibível do documento.
   */
  @ApiPropertyOptional({
    description: 'Título exibível do documento',
    example: 'Invoice #002 - Nordic Access (v2)',
  })
  @IsOptional()
  @IsString()
  title?: string;

  /**
   * JSON com os dados preenchidos no formulário.
   * Substitui completamente os dados anteriores.
   */
  @ApiPropertyOptional({
    description: 'JSON com os dados do formulário (estrutura varia por template)',
  })
  @IsOptional()
  @IsObject()
  formData?: Record<string, any>;

  /**
   * Dados da assinatura em base64 PNG.
   */
  @ApiPropertyOptional({
    description: 'Dados da assinatura em base64 PNG',
  })
  @IsOptional()
  @IsString()
  signatureData?: string;

  /**
   * Nome de quem assinou o documento.
   */
  @ApiPropertyOptional({
    description: 'Nome de quem assinou',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  signedBy?: string;
}
