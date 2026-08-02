/**
 * ============================================================================
 * CREATE TIMESHEET DTO - Validação para Criação de Weekly Timesheet
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os campos obrigatórios e opcionais para criar um novo Weekly Timesheet.
 * Usa class-validator para validar automaticamente os dados recebidos na API.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. O Team Leader seleciona um projeto e uma semana
 * 2. O backend preenche automaticamente jobScope, client e siteName do projeto
 * 3. Os 7 dias da semana são criados automaticamente com entradas vazias
 *
 * CAMPOS OBRIGATÓRIOS:
 * --------------------
 * - projectId: ID do projeto vinculado
 * - week:      Número da semana ISO (ex: "26")
 *
 * CAMPOS OPCIONAIS:
 * -----------------
 * - jobNumber: Nordic Access Job Number
 * - teamNo:    Número da equipe
 * ============================================================================
 */

import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para criar novo Weekly Timesheet.
 *
 * O backend preenche automaticamente os campos jobScope, client e siteName
 * a partir dos dados do projeto selecionado.
 */
export class CreateTimesheetDto {
  /**
   * ID do projeto ao qual este timesheet será vinculado.
   * Obrigatório — de onde vêm client, siteName e jobScope.
   */
  @ApiProperty({
    description: 'ID do projeto vinculado',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  projectId: string;

  /**
   * Número da semana ISO (1-53).
   * Define qual semana do ano este timesheet representa.
   */
  @ApiProperty({
    description: 'Número da semana ISO (ex: "26" para a 26ª semana)',
    example: '26',
  })
  @IsString()
  week: string;

  /**
   * Nordic Access Job Number (número interno do job).
   * Opcional — pode ser preenchido depois.
   */
  @ApiPropertyOptional({
    description: 'Nordic Access Job Number',
    example: 'NA-2026-001',
  })
  @IsOptional()
  @IsString()
  jobNumber?: string;

  /**
   * Número da equipe (ex: "1", "2", "3").
   * Opcional — identifica qual equipe preencheu o timesheet.
   */
  @ApiPropertyOptional({
    description: 'Número da equipe',
    example: '2',
  })
  @IsOptional()
  @IsString()
  teamNo?: string;
}
