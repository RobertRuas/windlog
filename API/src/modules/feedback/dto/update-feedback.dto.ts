/**
 * ============================================================================
 * UPDATE FEEDBACK DTO - Validação para Atualização de Feedback
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os campos que podem ser atualizados em um Feedback existente.
 *
 * QUEM PODE ATUALIZAR?
 * --------------------
 * - Qualquer campo: apenas ADMIN
 * - O usuário que criou NÃO pode editar (apenas ADMIN gerencia feedbacks)
 *
 * CAMPOS ATUALIZÁVEIS:
 * --------------------
 * - priority:    Prioridade do feedback (ADMIN define)
 * - status:      Status do feedback (ADMIN muda conforme resolução)
 * - adminNotes:  Notas internas do administrador
 * ============================================================================
 */

import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para atualizar um Feedback existente.
 *
 * Apenas ADMIN pode atualizar feedbacks (mudar status, prioridade, notas).
 * Todos os campos são opcionais — envia apenas o que mudou.
 */
export class UpdateFeedbackDto {
  /**
   * Prioridade do feedback.
   * ADMIN define a prioridade após triagem.
   */
  @ApiPropertyOptional({
    description: 'Prioridade do feedback',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  priority?: string;

  /**
   * Status atual do feedback.
   * ADMIN muda conforme o ciclo de vida:
   * NEW → TRIAGED → IN_PROGRESS → RESOLVED → CLOSED
   */
  @ApiPropertyOptional({
    description: 'Status do feedback',
    enum: ['NEW', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  })
  @IsOptional()
  @IsEnum(['NEW', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status?: string;

  /**
   * Notas internas do administrador.
   * Usado para registrar análise, resolução ou motivo de fechamento.
   */
  @ApiPropertyOptional({
    description: 'Notas internas do administrador',
    example: 'Bug reproduzido. Causa: validação incorreta no frontend. Corrigido no commit abc123.',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
