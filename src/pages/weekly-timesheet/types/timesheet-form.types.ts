/**
 * ============================================================================
 * TIMESHEET FORM TYPES - Tipos do Editor de Formulário do Timesheet
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Define as interfaces e tipos usados pelo editor de formulário do timesheet.
 * Centraliza os tipos para evitar duplicação e facilitar a manutenção.
 *
 * TIPOS PRINCIPAIS:
 * -----------------
 * - FormState: estado completo do formulário (todos os campos editáveis)
 * - FormDay: dados de um dia específico (data, progresso, entradas)
 * - FormEntry: uma linha de técnico dentro de um dia
 * - SystemUser: usuário do sistema para o dropdown de técnicos
 * - SharedFieldKey: campos compartilhados entre técnicos no mesmo dia
 * ============================================================================
 */

import type {
  WeeklyTimesheet,
  UpdateTimesheetPayload,
} from '@/services/weekly-timesheet.service';

/**
 * Props do componente TimesheetFormEditor.
 */
export interface TimesheetFormEditorProps {
  timesheet: WeeklyTimesheet;
  onSave: (payload: UpdateTimesheetPayload) => void;
  isSaving: boolean;
}

/**
 * Campos compartilhados entre técnicos de um mesmo dia.
 * Estes valores são iguais para todos os técnicos e salvos uma única vez.
 */
export const SHARED_FIELDS = [
  'localTurbineNo', 'turbineIdNo', 'towerNo', 'bladeNo',
  'standbyHrs', 'workingHrs', 'travelHrs', 'downtimeHrs', 'standbyReason',
] as const;

export type SharedFieldKey = (typeof SHARED_FIELDS)[number];

/**
 * Estado completo do formulário de edição do timesheet.
 * Contém todos os campos editáveis organizados por dia.
 */
export interface FormState {
  jobNumber: string;
  week: string;
  teamNo: string;
  jobScope: string;
  client: string;
  siteName: string;
  technicianName: string;
  technicianSignature: string;
  technicianDate: string;
  clientName: string;
  clientSignature: string;
  clientDate: string;
  days: FormDay[];
}

/**
 * Dados de um dia específico no formulário.
 * Cada dia tem suas informações compartilhadas e as entradas de técnicos.
 */
export interface FormDay {
  id: string;
  date: string;
  dayName: string;
  progress: string;
  shared: Record<SharedFieldKey, string>;
  entries: FormEntry[];
}

/**
 * Uma linha de técnico dentro de um dia.
 * Representa os dados de um técnico específico naquele dia.
 */
export interface FormEntry {
  id?: string;
  technicianName: string;
  role: string;
  /** ID do usuário vinculado (para controle de acesso de visualização) */
  userId?: string | null;
  /** Se é o entry do usuário atual (bloqueado para remoção) */
  isCurrentUser?: boolean;
}

/**
 * Usuário do sistema para o dropdown de seleção de técnicos.
 */
export interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
}

/**
 * Props do componente TechnicianSelect.
 */
export interface TechnicianSelectProps {
  value: string;
  onChange: (value: string) => void;
  onSelectUser: (user: SystemUser) => void;
  users: SystemUser[];
  /** Nomes já em uso neste dia (para evitar duplicidade) */
  excludeNames?: string[];
  disabled?: boolean;
  placeholder?: string;
  /** Texto exibido dentro do campo, após o nome (ex.: cargo entre parênteses) */
  suffix?: string;
}
