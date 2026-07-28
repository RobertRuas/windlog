/**
 * ============================================================================
 * SYSTEM LOG SERVICE - Serviço de Logs do Sistema (Frontend)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Serviço responsável por comunicar com a API de logs do sistema.
 * Fornece métodos para consultar logs com filtros e paginação.
 *
 * COMO FUNCIONA?
 * --------------
 * - getLogs(): retorna logs paginados com filtros
 * - getLogById(): retorna um log específico
 * - getStats(): retorna estatísticas dos logs
 * - cleanup(): remove logs antigos
 *
 * SEGURANÇA:
 * ----------
 * - Todos os endpoints requerem token JWT
 * - Apenas administradores (ADMIN) podem acessar
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

/**
 * Interface para um log individual retornado pela API.
 */
export interface SystemLog {
  id: string;
  action: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  entity: string | null;
  entityId: string | null;
  entityName: string | null;
  details: Record<string, any> | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  url: string | null;
  method: string | null;
  statusCode: number | null;
  duration: number | null;
  createdAt: string;
}

/**
 * Interface para filtros de logs.
 */
export interface LogFilters {
  search?: string;
  action?: string;
  severity?: string;
  userId?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Interface para resposta paginada de logs.
 */
export interface LogPaginatedResponse {
  data: SystemLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Interface para estatísticas dos logs.
 */
export interface LogStats {
  total: number;
  byAction: Array<{ action: string; count: number }>;
  bySeverity: Array<{ severity: string; count: number }>;
  topUsers: Array<{
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    count: number;
  }>;
}

/**
 * Busca logs paginados com filtros.
 *
 * @param filters - Filtros de busca (search, action, severity, userId, etc.)
 * @returns Promise com logs paginados
 */
export async function getLogs(filters: LogFilters = {}): Promise<LogPaginatedResponse> {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.action) params.append('action', filters.action);
  if (filters.severity) params.append('severity', filters.severity);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.entity) params.append('entity', filters.entity);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await api.get<ApiResponse<LogPaginatedResponse>>(`/system-logs?${params.toString()}`);
  return response.data;
}

/**
 * Busca um log específico por ID.
 *
 * @param id - ID do log
 * @returns Promise com o log
 */
export async function getLogById(id: string): Promise<SystemLog> {
  const response = await api.get<ApiResponse<SystemLog>>(`/system-logs/${id}`);
  return response.data;
}

/**
 * Busca estatísticas dos logs.
 *
 * @returns Promise com estatísticas
 */
export async function getLogStats(): Promise<LogStats> {
  const response = await api.get<ApiResponse<LogStats>>('/system-logs/stats');
  return response.data;
}

/**
 * Remove logs antigos (mais de X dias).
 *
 * @param days - Número de dias para manter (padrão: 90)
 * @returns Promise com quantidade de logs removidos
 */
export async function cleanupLogs(days: number = 90): Promise<number> {
  const response = await api.delete<ApiResponse<number>>(`/system-logs/cleanup?days=${days}`);
  return response.data;
}
