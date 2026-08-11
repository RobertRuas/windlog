/**
 * ============================================================================
 * TIMESHEET FORM HELPERS - Funções Auxiliares do Editor de Timesheet
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Funções puras de conversão e validação usadas pelo editor de timesheet.
 * Separadas do componente para facilitar testes e reutilização.
 *
 * FUNÇÕES:
 * --------
 * - formatDateBR: converte data ISO (2024-01-15) para formato BR (15/01/2024)
 * - formatDateISO: converte data BR (15/01/2024) para formato ISO (2024-01-15)
 * - isDayFilled: verifica se um dia tem progresso + pelo menos 1 técnico
 * - detectSharedValues: fallback para detectar valores compartilhados dos entries
 * - timesheetToFormState: converte dados da API → estado do formulário
 * - formStateToPayload: converte estado do formulário → payload para API
 * - createEmptyEntry: cria uma entrada vazia de técnico
 * - emptyShared: cria objeto de valores compartilhados vazio
 * ============================================================================
 */

import type {
  WeeklyTimesheet,
  UpdateTimesheetPayload,
  UpdateDayPayload,
  UpdateEntryPayload,
} from '@/services/weekly-timesheet.service';
import type {
  FormState,
  FormDay,
  FormEntry,
  SharedFieldKey,
} from '../types/timesheet-form.types';
import { SHARED_FIELDS } from '../types/timesheet-form.types';

/**
 * Converte data ISO para formato brasileiro (DD/MM/YYYY).
 * Ex: "2024-01-15T00:00:00" → "15/01/2024"
 */
export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const pureDate = dateStr.split('T')[0];
  const parts = pureDate.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

/**
 * Converte data brasileira para formato ISO (YYYY-MM-DD).
 * Ex: "15/01/2024" → "2024-01-15"
 */
export function formatDateISO(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
}

/**
 * Verifica se um dia está "preenchido" (tem progress + pelo menos 1 entry com nome).
 * Usado para determinar a cor do indicador do dia (verde = preenchido, laranja = pendente).
 */
export function isDayFilled(day: FormDay): boolean {
  const hasProgress = day.progress.trim().length > 0;
  // Considera apenas técnicos que não são o usuário atual
  const hasNamedEntry = day.entries.some(
    (e) => e.technicianName.trim().length > 0 && !e.isCurrentUser,
  );
  return hasProgress && hasNamedEntry;
}

/**
 * Fallback: detecta valores compartilhados a partir dos entries.
 * NÃO MAIS USADO como principal — sharedValues agora vem da API (persistidos no banco).
 * Mantido apenas para timesheets antigos que não têm sharedValues salvos.
 */
export function detectSharedValues(
  entries: { [key: string]: any }[],
): Record<SharedFieldKey, string> {
  const result: Record<string, string> = {};
  for (const field of SHARED_FIELDS) {
    const values = entries.map((e) => e[field] || '');
    const allSame = values.length > 0 && values.every((v) => v === values[0]);
    result[field] = allSame ? values[0] : '';
  }
  return result as Record<SharedFieldKey, string>;
}

/**
 * Converte dados da API (WeeklyTimesheet) para o estado do formulário (FormState).
 * Usado ao carregar o timesheet na página de edição.
 */
export function timesheetToFormState(ts: WeeklyTimesheet): FormState {
  return {
    jobNumber: ts.jobNumber || '',
    week: ts.week || '',
    teamNo: ts.teamNo || '',
    jobScope: ts.jobScope || '',
    client: ts.client || '',
    siteName: ts.siteName || '',
    technicianName: ts.technicianName || '',
    technicianSignature: ts.technicianSignature || '',
    technicianDate: formatDateBR(ts.technicianDate) || formatDateBR(new Date().toISOString()),
    clientName: ts.clientName || '',
    clientSignature: ts.clientSignature || '',
    clientDate: formatDateBR(ts.clientDate),
    days: ts.days.map((day) => {
      // Usa sharedValues da API se disponível, senão detecta dos entries (fallback)
      const shared: Record<SharedFieldKey, string> = day.sharedValues
        ? {
            localTurbineNo: day.sharedValues.localTurbineNo || '',
            turbineIdNo: day.sharedValues.turbineIdNo || '',
            towerNo: day.sharedValues.towerNo || '',
            bladeNo: day.sharedValues.bladeNo || '',
            standbyHrs: day.sharedValues.standbyHrs || '',
            workingHrs: day.sharedValues.workingHrs || '',
            travelHrs: day.sharedValues.travelHrs || '',
            downtimeHrs: day.sharedValues.downtimeHrs || '',
            standbyReason: day.sharedValues.standbyReason || '',
          }
        : detectSharedValues(day.entries);
      return {
        id: day.id,
        date: formatDateBR(day.date),
        dayName: day.dayName,
        progress: day.progress || '',
        shared,
        entries: day.entries.map((e) => ({
          id: e.id,
          technicianName: e.technicianName || '',
          role: e.role || '',
          userId: e.userId || null,
        })),
      };
    }),
  };
}

/**
 * Converte estado do formulário (FormState) para payload da API.
 * Usado ao salvar as alterações no backend.
 * Aplica os shared values a cada entry (todos usam as informações comuns).
 */
export function formStateToPayload(form: FormState): UpdateTimesheetPayload {
  return {
    jobNumber: form.jobNumber || undefined,
    week: form.week || undefined,
    teamNo: form.teamNo || undefined,
    jobScope: form.jobScope || undefined,
    client: form.client || undefined,
    siteName: form.siteName || undefined,
    technicianName: form.technicianName || undefined,
    technicianSignature: form.technicianSignature !== undefined ? (form.technicianSignature || '') : undefined,
    technicianDate: form.technicianDate ? formatDateISO(form.technicianDate) : undefined,
    clientName: form.clientName || undefined,
    clientSignature: form.clientSignature !== undefined ? (form.clientSignature || '') : undefined,
    clientDate: form.clientDate ? formatDateISO(form.clientDate) : undefined,
    days: form.days.map((day): UpdateDayPayload => ({
      id: day.id,
      dayName: day.dayName,
      progress: day.progress,
      // Persiste sharedValues no banco para que sejam recarregados ao voltar à página
      sharedValues: { ...day.shared },
      entries: day.entries.map((e, idx): UpdateEntryPayload => ({
        id: e.id,
        userId: e.userId || undefined,
        technicianName: e.technicianName,
        role: e.role || undefined,
        // Persiste a ordem das entries (reorder dos técnicos)
        sortOrder: idx,
        // Aplica shared values a cada entry (todos usam as informações comuns)
        localTurbineNo: day.shared.localTurbineNo || undefined,
        turbineIdNo: day.shared.turbineIdNo || undefined,
        towerNo: day.shared.towerNo || undefined,
        bladeNo: day.shared.bladeNo || undefined,
        standbyHrs: day.shared.standbyHrs || undefined,
        workingHrs: day.shared.workingHrs || undefined,
        travelHrs: day.shared.travelHrs || undefined,
        downtimeHrs: day.shared.downtimeHrs || undefined,
        standbyReason: day.shared.standbyReason || undefined,
      })),
    })),
  };
}

/**
 * Cria uma entrada vazia de técnico (nome e role em branco).
 */
export function createEmptyEntry(): FormEntry {
  return {
    technicianName: '',
    role: '',
  };
}

/**
 * Cria um objeto de valores compartilhados vazio (todos os campos em string vazia).
 */
export function emptyShared(): Record<SharedFieldKey, string> {
  return {
    localTurbineNo: '', turbineIdNo: '', towerNo: '', bladeNo: '',
    standbyHrs: '', workingHrs: '', travelHrs: '', downtimeHrs: '',
    standbyReason: '',
  };
}
