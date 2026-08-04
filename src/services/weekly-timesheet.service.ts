/**
 * ============================================================================
 * WEEKLY TIMESHEET SERVICE - Serviço de Timesheets (Frontend)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Contém as funções que fazem chamadas à API de Weekly Timesheets.
 * Separamos a lógica de API em um serviço para manter os componentes
 * limpos e focados apenas na interface do usuário.
 *
 * FUNÇÕES DISPONÍVEIS:
 * --------------------
 * - getTimesheets(): lista timesheets paginados
 * - getTimesheetById(): busca um timesheet completo
 * - createTimesheet(): cria novo timesheet
 * - updateTimesheet(): atualiza timesheet (metadata + dias + entradas)
 * - deleteTimesheet(): remove timesheet (soft delete)
 * - submitTimesheet(): submete timesheet para aprovação
 * - getTimesheetsByProject(): lista timesheets de um projeto
 * ============================================================================
 */

import { api } from './api';

/**
 * Interface para a resposta padrão da API.
 */
interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

// =========================================================================
// TYPES - Interfaces para tipagem dos dados
// =========================================================================

/**
 * Entrada individual de técnico em um dia (linha da planilha).
 */
export interface TimesheetEntry {
  id: string;
  dayId: string;
  userId?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position?: string | null;
  } | null;
  technicianName: string;
  role?: string | null;
  localTurbineNo?: string | null;
  turbineIdNo?: string | null;
  towerNo?: string | null;
  bladeNo?: string | null;
  standbyHrs?: string | null;
  workingHrs?: string | null;
  travelHrs?: string | null;
  downtimeHrs?: string | null;
  standbyReason?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Valores comuns compartilhados entre todos os técnicos de um dia.
 */
export interface SharedValues {
  localTurbineNo: string;
  turbineIdNo: string;
  towerNo: string;
  bladeNo: string;
  standbyHrs: string;
  workingHrs: string;
  travelHrs: string;
  downtimeHrs: string;
  standbyReason: string;
}

/**
 * Dia do timesheet com suas entradas (linhas de técnicos).
 */
export interface TimesheetDay {
  id: string;
  timesheetId: string;
  date: string;
  dayName: string;
  progress?: string | null;
  sortOrder: number;
  sharedValues?: SharedValues | null;
  entries: TimesheetEntry[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Status possíveis do timesheet.
 */
export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';

/**
 * Timesheet completo com todas as relações.
 * Retornado pelo endpoint GET /weekly-timesheets/:id
 */
export interface WeeklyTimesheet {
  id: string;
  projectId: string;
  project: {
    id: string;
    name: string;
    client: string;
    location: string;
    scope?: string | null;
  };
  jobNumber?: string | null;
  week: string;
  teamNo?: string | null;
  jobScope?: string | null;
  client?: string | null;
  siteName?: string | null;
  createdBy: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  technicianName?: string | null;
  technicianSignature?: string | null;
  technicianDate?: string | null;
  clientName?: string | null;
  clientSignature?: string | null;
  clientDate?: string | null;
  status: TimesheetStatus;
  days: TimesheetDay[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Timesheet resumido para listagem.
 * Retornado pelo endpoint GET /weekly-timesheets
 */
export interface TimesheetListItem {
  id: string;
  projectId: string;
  project: {
    id: string;
    name: string;
    client: string;
    location: string;
  };
  jobNumber?: string | null;
  week: string;
  teamNo?: string | null;
  status: TimesheetStatus;
  createdBy: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count: {
    days: number;
  };
  /**
   * Totais de horas calculados pelo backend.
   * Soma de todas as entradas de todos os dias do timesheet.
   */
  _totals: {
    workingHrs: number;
    standbyHrs: number;
    travelHrs: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Dados para criar um novo timesheet.
 */
export interface CreateTimesheetPayload {
  projectId: string;
  week: string;
  jobNumber?: string;
  teamNo?: string;
}

/**
 * Dados de entrada para atualização (linha de técnico).
 */
export interface UpdateEntryPayload {
  id?: string;
  userId?: string | null;
  technicianName?: string;
  role?: string;
  localTurbineNo?: string;
  turbineIdNo?: string;
  towerNo?: string;
  bladeNo?: string;
  standbyHrs?: string;
  workingHrs?: string;
  travelHrs?: string;
  downtimeHrs?: string;
  standbyReason?: string;
  sortOrder?: number;
}

/**
 * Dados de dia para atualização aninhada.
 */
export interface UpdateDayPayload {
  id?: string;
  date?: string;
  dayName?: string;
  progress?: string;
  sortOrder?: number;
  sharedValues?: Record<string, string>;
  entries?: UpdateEntryPayload[];
}

/**
 * Dados completos para atualizar um timesheet.
 */
export interface UpdateTimesheetPayload {
  jobNumber?: string;
  week?: string;
  teamNo?: string;
  jobScope?: string;
  client?: string;
  siteName?: string;
  technicianName?: string;
  technicianSignature?: string;
  technicianDate?: string;
  clientName?: string;
  clientSignature?: string;
  clientDate?: string;
  days?: UpdateDayPayload[];
}

/**
 * Resposta paginada da API.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// =========================================================================
// FUNÇÕES DA API
// =========================================================================

const BASE_URL = '/api/v1/weekly-timesheets';

/**
 * Lista timesheets com paginação e filtros.
 *
 * @param params - Parâmetros de filtro (projectId, week, status, page, limit)
 * @returns Lista paginada de timesheets
 */
export async function getTimesheets(
  params: Record<string, string | number | undefined> = {},
): Promise<ApiResponse<PaginatedResponse<TimesheetListItem>>> {
  // Constrói a query string a partir dos parâmetros
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;

  return api.get(url);
}

/**
 * Busca um timesheet completo pelo ID (com dias, entradas e relações).
 *
 * @param id - ID do timesheet
 * @returns Timesheet completo
 */
export async function getTimesheetById(
  id: string,
): Promise<ApiResponse<WeeklyTimesheet>> {
  return api.get(`${BASE_URL}/${id}`);
}

/**
 * Cria um novo Weekly Timesheet vinculado a um projeto.
 * Os 7 dias da semana são gerados automaticamente pelo backend.
 *
 * @param data - Dados para criação
 * @returns Timesheet criado
 */
export async function createTimesheet(
  data: CreateTimesheetPayload,
): Promise<ApiResponse<WeeklyTimesheet>> {
  return api.post(BASE_URL, data);
}

/**
 * Atualiza um timesheet existente (metadata + dias + entradas).
 * Suporta atualização aninhada.
 *
 * @param id - ID do timesheet
 * @param data - Dados para atualização
 * @returns Timesheet atualizado
 */
export async function updateTimesheet(
  id: string,
  data: UpdateTimesheetPayload,
): Promise<ApiResponse<WeeklyTimesheet>> {
  return api.put(`${BASE_URL}/${id}`, data);
}

/**
 * Remove um timesheet (soft delete).
 *
 * @param id - ID do timesheet
 */
export async function deleteTimesheet(
  id: string,
): Promise<ApiResponse<{ message: string }>> {
  return api.delete(`${BASE_URL}/${id}`);
}

/**
 * Submete um timesheet para aprovação (muda status de DRAFT para SUBMITTED).
 *
 * @param id - ID do timesheet
 * @returns Timesheet com status atualizado
 */
export async function submitTimesheet(
  id: string,
): Promise<ApiResponse<WeeklyTimesheet>> {
  return api.post(`${BASE_URL}/${id}/submit`, {});
}

/**
 * Lista todos os timesheets de um projeto específico.
 *
 * @param projectId - ID do projeto
 * @returns Lista de timesheets do projeto
 */
export async function getTimesheetsByProject(
  projectId: string,
): Promise<ApiResponse<TimesheetListItem[]>> {
  return api.get(`${BASE_URL}/project/${projectId}`);
}
