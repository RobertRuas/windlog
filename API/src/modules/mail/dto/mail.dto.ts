/**
 * ============================================================================
 * MAIL DTO - Data Transfer Objects do Módulo de E-mail
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os schemas de validação para todos os endpoints do módulo de
 * e-mail (conta, pastas, mensagens, etiquetas, regras, contatos, grupos,
 * assinaturas, remetentes bloqueados e respostas automáticas).
 *
 * CONVENÇÃO:
 * ----------
 * Todo campo opcional usa @IsOptional() + o validador de tipo.
 * ============================================================================
 */

import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsArray,
  IsInt,
  IsUUID,
  IsEnum,
  IsDateString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

// =========================================================================
// CONTA DE E-MAIL
// =========================================================================

/**
 * DTO para conectar a conta de e-mail (apenas e-mail + senha).
 * As configurações de servidor são fixas e pré-definidas.
 */
export class ConnectMailAccountDto {
  @ApiProperty({ description: 'Endereço de e-mail', example: 'nome@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha da conta de e-mail' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Protocolo de recebimento (padrão: IMAP)', enum: ['IMAP', 'POP3'] })
  @IsOptional()
  @IsEnum(['IMAP', 'POP3'])
  protocol?: 'IMAP' | 'POP3';
}

/**
 * DTO para atualizar a conta de e-mail.
 */
export class UpdateMailAccountDto {
  @ApiPropertyOptional({ description: 'Nova senha da conta' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Protocolo de recebimento', enum: ['IMAP', 'POP3'] })
  @IsOptional()
  @IsEnum(['IMAP', 'POP3'])
  protocol?: 'IMAP' | 'POP3';

  @ApiPropertyOptional({ description: 'Notificar novas mensagens internamente' })
  @IsOptional()
  @IsBoolean()
  notifyOnNew?: boolean;
}

// =========================================================================
// PASTAS
// =========================================================================

/**
 * DTO para criar/renomear pasta personalizada.
 */
export class MailFolderDto {
  @ApiProperty({ description: 'Nome da pasta', example: 'Projetos 2026' })
  @IsString()
  @MaxLength(100)
  name: string;
}

// =========================================================================
// MENSAGENS
// =========================================================================

/**
 * Endereço de e-mail estruturado (nome + endereço).
 */
export class MailAddressDto {
  @ApiPropertyOptional({ description: 'Nome de exibição' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Endereço de e-mail' })
  @IsEmail()
  address: string;
}

/**
 * DTO para enviar e-mail (direto ou a partir de rascunho).
 */
export class SendMailDto {
  @ApiProperty({ description: 'Destinatários principais', type: [MailAddressDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MailAddressDto)
  to: MailAddressDto[];

  @ApiPropertyOptional({ description: 'Destinatários em cópia', type: [MailAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MailAddressDto)
  cc?: MailAddressDto[];

  @ApiPropertyOptional({ description: 'Destinatários em cópia oculta', type: [MailAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MailAddressDto)
  bcc?: MailAddressDto[];

  @ApiPropertyOptional({ description: 'Assunto da mensagem' })
  @IsOptional()
  @IsString()
  @MaxLength(998)
  subject?: string;

  @ApiPropertyOptional({ description: 'Corpo da mensagem (texto ou HTML)' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Se o corpo é HTML' })
  @IsOptional()
  @IsBoolean()
  isHtml?: boolean;

  @ApiPropertyOptional({ description: 'ID do rascunho sendo enviado' })
  @IsOptional()
  @IsUUID()
  draftId?: string;

  @ApiPropertyOptional({ description: 'Message-ID da mensagem respondida' })
  @IsOptional()
  @IsString()
  inReplyTo?: string;

  @ApiPropertyOptional({ description: 'References para threading' })
  @IsOptional()
  @IsString()
  references?: string;

  @ApiPropertyOptional({ description: 'IDs de anexos enviados previamente', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentIds?: string[];
}

/**
 * DTO para salvar/atualizar rascunho.
 */
export class SaveDraftDto {
  @ApiPropertyOptional({ description: 'Destinatários principais', type: [MailAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MailAddressDto)
  to?: MailAddressDto[];

  @ApiPropertyOptional({ description: 'Destinatários em cópia', type: [MailAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MailAddressDto)
  cc?: MailAddressDto[];

  @ApiPropertyOptional({ description: 'Destinatários em cópia oculta', type: [MailAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MailAddressDto)
  bcc?: MailAddressDto[];

  @ApiPropertyOptional({ description: 'Assunto' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Corpo da mensagem' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Se o corpo é HTML' })
  @IsOptional()
  @IsBoolean()
  isHtml?: boolean;
}

/**
 * DTO para atualizar flags da mensagem (lida, sinalizada, importante).
 */
export class UpdateMessageFlagsDto {
  @ApiPropertyOptional({ description: 'Marcada como lida' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Sinalizada (star)' })
  @IsOptional()
  @IsBoolean()
  isFlagged?: boolean;

  @ApiPropertyOptional({ description: 'Importante' })
  @IsOptional()
  @IsBoolean()
  isImportant?: boolean;
}

/**
 * DTO para mover mensagem para outra pasta.
 */
export class MoveMessageDto {
  @ApiProperty({ description: 'ID da pasta de destino' })
  @IsUUID()
  folderId: string;
}

/**
 * Filtros para listagem/busca avançada de mensagens.
 */
export class MessageFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'ID da pasta' })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiPropertyOptional({ description: 'Busca livre (assunto, remetente, conteúdo)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtra por remetente (endereço)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filtra por destinatário (endereço)' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ description: 'Filtra por assunto' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Filtra por conteúdo do corpo' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Apenas não lidas' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  unread?: boolean;

  @ApiPropertyOptional({ description: 'Apenas sinalizadas' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  flagged?: boolean;

  @ApiPropertyOptional({ description: 'Apenas importantes' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  important?: boolean;

  @ApiPropertyOptional({ description: 'Apenas com anexos' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  hasAttachments?: boolean;

  @ApiPropertyOptional({ description: 'ID da etiqueta para filtrar' })
  @IsOptional()
  @IsUUID()
  labelId?: string;

  @ApiPropertyOptional({ description: 'Data inicial (ISO)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final (ISO)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// =========================================================================
// ETIQUETAS
// =========================================================================

/**
 * DTO para criar/atualizar etiqueta.
 */
export class MailLabelDto {
  @ApiProperty({ description: 'Nome da etiqueta', example: 'Urgente' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: 'Cor em hexadecimal', example: '#3b82f6' })
  @IsOptional()
  @IsString()
  color?: string;
}

/**
 * DTO para aplicar/remover etiqueta em mensagem.
 */
export class MessageLabelDto {
  @ApiProperty({ description: 'ID da etiqueta' })
  @IsUUID()
  labelId: string;
}

// =========================================================================
// REGRAS AUTOMÁTICAS
// =========================================================================

/**
 * DTO para criar regra automática.
 */
export class CreateMailRuleDto {
  @ApiProperty({ description: 'Nome da regra' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Se a regra está ativa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Condição', enum: ['FROM', 'TO', 'SUBJECT', 'CONTAINS', 'HAS_ATTACHMENT'] })
  @IsEnum(['FROM', 'TO', 'SUBJECT', 'CONTAINS', 'HAS_ATTACHMENT'])
  conditionType: 'FROM' | 'TO' | 'SUBJECT' | 'CONTAINS' | 'HAS_ATTACHMENT';

  @ApiPropertyOptional({ description: 'Valor da condição' })
  @IsOptional()
  @IsString()
  conditionValue?: string;

  @ApiProperty({
    description: 'Ação',
    enum: ['MOVE_TO_FOLDER', 'FLAG', 'MARK_IMPORTANT', 'MARK_READ', 'LABEL', 'FORWARD', 'AUTO_REPLY', 'MOVE_TO_SPAM', 'DELETE'],
  })
  @IsEnum(['MOVE_TO_FOLDER', 'FLAG', 'MARK_IMPORTANT', 'MARK_READ', 'LABEL', 'FORWARD', 'AUTO_REPLY', 'MOVE_TO_SPAM', 'DELETE'])
  actionType: 'MOVE_TO_FOLDER' | 'FLAG' | 'MARK_IMPORTANT' | 'MARK_READ' | 'LABEL' | 'FORWARD' | 'AUTO_REPLY' | 'MOVE_TO_SPAM' | 'DELETE';

  @ApiPropertyOptional({ description: 'Valor da ação (pasta, e-mail ou texto)' })
  @IsOptional()
  @IsString()
  actionValue?: string;

  @ApiPropertyOptional({ description: 'Ordem de execução' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

/**
 * DTO para atualizar regra (todos os campos opcionais).
 */
export class UpdateMailRuleDto {
  @ApiPropertyOptional({ description: 'Nome da regra' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Se a regra está ativa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Condição', enum: ['FROM', 'TO', 'SUBJECT', 'CONTAINS', 'HAS_ATTACHMENT'] })
  @IsOptional()
  @IsEnum(['FROM', 'TO', 'SUBJECT', 'CONTAINS', 'HAS_ATTACHMENT'])
  conditionType?: 'FROM' | 'TO' | 'SUBJECT' | 'CONTAINS' | 'HAS_ATTACHMENT';

  @ApiPropertyOptional({ description: 'Valor da condição' })
  @IsOptional()
  @IsString()
  conditionValue?: string;

  @ApiPropertyOptional({
    description: 'Ação',
    enum: ['MOVE_TO_FOLDER', 'FLAG', 'MARK_IMPORTANT', 'MARK_READ', 'LABEL', 'FORWARD', 'AUTO_REPLY', 'MOVE_TO_SPAM', 'DELETE'],
  })
  @IsOptional()
  @IsEnum(['MOVE_TO_FOLDER', 'FLAG', 'MARK_IMPORTANT', 'MARK_READ', 'LABEL', 'FORWARD', 'AUTO_REPLY', 'MOVE_TO_SPAM', 'DELETE'])
  actionType?: 'MOVE_TO_FOLDER' | 'FLAG' | 'MARK_IMPORTANT' | 'MARK_READ' | 'LABEL' | 'FORWARD' | 'AUTO_REPLY' | 'MOVE_TO_SPAM' | 'DELETE';

  @ApiPropertyOptional({ description: 'Valor da ação' })
  @IsOptional()
  @IsString()
  actionValue?: string;

  @ApiPropertyOptional({ description: 'Ordem de execução' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

// =========================================================================
// CONTATOS E GRUPOS
// =========================================================================

/**
 * DTO para criar/atualizar contato.
 */
export class MailContactDto {
  @ApiProperty({ description: 'Endereço de e-mail do contato' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Nome de exibição' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Empresa/organização' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;
}

/**
 * DTO para criar/atualizar grupo de contatos.
 */
export class MailContactGroupDto {
  @ApiProperty({ description: 'Nome do grupo', example: 'Equipa Norte' })
  @IsString()
  @MaxLength(100)
  name: string;
}

/**
 * DTO para adicionar/remover membro de grupo.
 */
export class GroupMemberDto {
  @ApiProperty({ description: 'ID do contato' })
  @IsUUID()
  contactId: string;
}

// =========================================================================
// ASSINATURAS
// =========================================================================

/**
 * DTO para criar/atualizar assinatura.
 */
export class MailSignatureDto {
  @ApiProperty({ description: 'Nome da assinatura', example: 'Trabalho' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Conteúdo da assinatura (HTML ou texto)' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Se é a assinatura padrão' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

// =========================================================================
// REMETENTES BLOQUEADOS
// =========================================================================

/**
 * DTO para bloquear remetente.
 */
export class BlockSenderDto {
  @ApiProperty({ description: 'Endereço de e-mail ou domínio a bloquear', example: 'spam@dominio.com' })
  @IsString()
  email: string;
}

// =========================================================================
// RESPOSTA AUTOMÁTICA / AUSÊNCIA
// =========================================================================

/**
 * DTO para configurar resposta automática / mensagem de ausência.
 */
export class AutoReplyDto {
  @ApiPropertyOptional({ description: 'Se está habilitada' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Assunto da resposta' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional({ description: 'Corpo da mensagem automática' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Início do período de ausência (ISO)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fim do período de ausência (ISO)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
