/**
 * ============================================================================
 * UPDATE TIMESHEET DTO - Validação para Atualização de Weekly Timesheet
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define os campos que podem ser atualizados em um Weekly Timesheet existente.
 * Suporta atualização aninhada: metadata + dias + entradas em uma única chamada.
 *
 * COMO FUNCIONA?
 * --------------
 * 1. O Team Leader envia o timesheet completo com todas as alterações
 * 2. O backend compara e atualiza dias/entradas que mudaram
 * 3. Entradas sem ID são criadas, entradas com ID são atualizadas,
 *    entradas que não vieram são removidas
 *
 * CAMPOS ATUALIZÁVEIS:
 * --------------------
 * - Metadata:  jobNumber, teamNo, jobScope, client, siteName
 * - Assinaturas: technicianName, technicianSignature, technicianDate,
 *                clientName, clientSignature, clientDate
 * - Dias:       date, dayName, progress, entries[]
 * - Entradas:   technicianName, role, localTurbineNo, turbineIdNo,
 *               towerNo, bladeNo, standbyHrs, workingHrs, travelHrs,
 *               downtimeHrs, standbyReason
 * ============================================================================
 */

import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsUUID,
  ValidateNested,
  IsNumber,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para atualizar uma entrada individual (linha de técnico no dia).
 * Se tiver 'id', atualiza. Se não tiver, cria nova entrada.
 */
export class UpdateEntryDto {
  /** ID da entrada (se existir, atualiza; se não, cria nova) */
  @ApiPropertyOptional({ description: 'ID da entrada (nulo para novas entradas)' })
  @IsOptional()
  @IsUUID()
  id?: string;

  /** ID do usuário/técnico vinculado (opcional) */
  @ApiPropertyOptional({ description: 'ID do usuário/técnico do sistema' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /** Nome do técnico */
  @ApiPropertyOptional({ description: 'Nome do técnico', example: 'Robert Ruas' })
  @IsOptional()
  @IsString()
  technicianName?: string;

  /** Função/cargo do técnico no dia */
  @ApiPropertyOptional({ description: 'Função do técnico', example: 'Lead Technician' })
  @IsOptional()
  @IsString()
  role?: string;

  /** Número local da turbina (ex: "WEA1") */
  @ApiPropertyOptional({ description: 'Número local da turbina' })
  @IsOptional()
  @IsString()
  localTurbineNo?: string;

  /** ID da turbina (ex: "552201011") */
  @ApiPropertyOptional({ description: 'ID da turbina' })
  @IsOptional()
  @IsString()
  turbineIdNo?: string;

  /** Número da torre Max Bögl */
  @ApiPropertyOptional({ description: 'Número da torre Max Bögl' })
  @IsOptional()
  @IsString()
  towerNo?: string;

  /** Número da pá (se aplicável) */
  @ApiPropertyOptional({ description: 'Número da pá' })
  @IsOptional()
  @IsString()
  bladeNo?: string;

  /** Horas de standby */
  @ApiPropertyOptional({ description: 'Horas de standby', example: '2' })
  @IsOptional()
  @IsString()
  standbyHrs?: string;

  /** Horas de trabalho efetivo */
  @ApiPropertyOptional({ description: 'Horas de trabalho', example: '8' })
  @IsOptional()
  @IsString()
  workingHrs?: string;

  /** Horas de viagem/deslocamento */
  @ApiPropertyOptional({ description: 'Horas de viagem', example: '1.5' })
  @IsOptional()
  @IsString()
  travelHrs?: string;

  /** Horas de downtime da turbina */
  @ApiPropertyOptional({ description: 'Horas de downtime WTG' })
  @IsOptional()
  @IsString()
  downtimeHrs?: string;

  /** Motivo do standby */
  @ApiPropertyOptional({ description: 'Motivo do standby', example: 'Weather conditions' })
  @IsOptional()
  @IsString()
  standbyReason?: string;

  /** Ordem de exibição dentro do dia */
  @ApiPropertyOptional({ description: 'Ordem da linha (0 = primeira)' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

/**
 * DTO para atualizar um dia do timesheet (com suas entradas aninhadas).
 */
export class UpdateDayDto {
  /** ID do dia (se existir, atualiza; se não, cria novo) */
  @ApiPropertyOptional({ description: 'ID do dia (nulo para novos dias)' })
  @IsOptional()
  @IsUUID()
  id?: string;

  /** Data completa do dia (ex: "2026-06-22") */
  @ApiPropertyOptional({ description: 'Data do dia', example: '2026-06-22' })
  @IsOptional()
  @IsDateString()
  date?: string;

  /** Nome do dia em inglês (ex: "Monday") */
  @ApiPropertyOptional({ description: 'Nome do dia', example: 'Monday' })
  @IsOptional()
  @IsString()
  dayName?: string;

  /** Descrição do progresso diário */
  @ApiPropertyOptional({ description: 'Progresso diário' })
  @IsOptional()
  @IsString()
  progress?: string;

  /** Ordem de exibição (0=Monday, 6=Sunday) */
  @ApiPropertyOptional({ description: 'Ordem do dia na semana' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  /** Valores comuns a todos os técnicos do dia (turbina, horas, etc.) */
  @ApiPropertyOptional({
    description: 'Valores comuns do dia (turbina, horas, standby, etc.)',
    example: {
      localTurbineNo: 'WEA1',
      turbineIdNo: '552201011',
      towerNo: 'G20_001234_DE',
      bladeNo: '',
      standbyHrs: '0',
      workingHrs: '8',
      travelHrs: '1.5',
      downtimeHrs: '0',
      standbyReason: '',
    },
  })
  @IsOptional()
  @IsObject()
  sharedValues?: Record<string, string>;

  /** Entradas (linhas de técnicos) deste dia */
  @ApiPropertyOptional({ description: 'Entradas de técnicos deste dia', type: [UpdateEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateEntryDto)
  entries?: UpdateEntryDto[];
}

/**
 * DTO principal para atualizar um Weekly Timesheet existente.
 * Todos os campos são opcionais — envia apenas o que mudou.
 */
export class UpdateTimesheetDto {
  // ── Metadata do documento ──────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Nordic Access Job Number' })
  @IsOptional()
  @IsString()
  jobNumber?: string;

  @ApiPropertyOptional({ description: 'Número da semana' })
  @IsOptional()
  @IsString()
  week?: string;

  @ApiPropertyOptional({ description: 'Número da equipe' })
  @IsOptional()
  @IsString()
  teamNo?: string;

  @ApiPropertyOptional({ description: 'Escopo do trabalho' })
  @IsOptional()
  @IsString()
  jobScope?: string;

  @ApiPropertyOptional({ description: 'Nome do cliente' })
  @IsOptional()
  @IsString()
  client?: string;

  @ApiPropertyOptional({ description: 'Nome do local/projeto' })
  @IsOptional()
  @IsString()
  siteName?: string;

  // ── Assinaturas ─────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Nome do técnico para assinatura' })
  @IsOptional()
  @IsString()
  technicianName?: string;

  @ApiPropertyOptional({ description: 'Assinatura do técnico' })
  @IsOptional()
  @IsString()
  technicianSignature?: string;

  @ApiPropertyOptional({ description: 'Data da assinatura do técnico' })
  @IsOptional()
  @IsDateString()
  technicianDate?: string;

  @ApiPropertyOptional({ description: 'Nome do cliente para assinatura' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ description: 'Assinatura do cliente' })
  @IsOptional()
  @IsString()
  clientSignature?: string;

  @ApiPropertyOptional({ description: 'Data da assinatura do cliente' })
  @IsOptional()
  @IsDateString()
  clientDate?: string;

  // ── Dias e entradas (atualização aninhada) ──────────────────────────

  @ApiPropertyOptional({
    description: 'Lista de dias com suas entradas (atualização aninhada)',
    type: [UpdateDayDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDayDto)
  days?: UpdateDayDto[];
}
