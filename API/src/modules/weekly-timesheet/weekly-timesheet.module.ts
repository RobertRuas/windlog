/**
 * ============================================================================
 * WEEKLY TIMESHEET MODULE - Módulo de Gestão de Timesheets Semanais
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Módulo NestJS que organiza e registra todos os componentes do módulo
 * de Weekly Timesheet (controller, service, DTOs).
 *
 * O QUE ESTE MÓDULO FAZ?
 * ----------------------
 * - Registra o WeeklyTimesheetController e WeeklyTimesheetService
 * - Exporta o WeeklyTimesheetService para uso em outros módulos
 * - Gerencia planilhas semanais de horas de trabalho
 * ============================================================================
 */

import { Module } from '@nestjs/common';
import { WeeklyTimesheetController } from './weekly-timesheet.controller.js';
import { WeeklyTimesheetService } from './weekly-timesheet.service.js';
import { PrismaService } from '../../database/prisma.service.js';

/**
 * Módulo WeeklyTimesheetModule - Gerencia operações CRUD de timesheets semanais.
 */
@Module({
  controllers: [WeeklyTimesheetController],
  providers: [WeeklyTimesheetService, PrismaService],
  exports: [WeeklyTimesheetService],
})
export class WeeklyTimesheetModule {}
