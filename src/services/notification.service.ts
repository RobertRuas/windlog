/**
 * ============================================================================
 * NOTIFICATION SERVICE - Serviço de Notificações (Frontend)
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Serviço para comunicação com a API de notificações do backend.
 * Fornece métodos para buscar, atualizar e gerir notificações do usuário.
 *
 * COMO FUNCIONA?
 * --------------
 * - getNotifications(): lista notificações paginadas com filtros
 * - getUnreadCount(): retorna contagem de não lidas
 * - markAsRead(): marca uma notificação como lida
 * - markAllAsRead(): marca todas como lidas
 * - deleteNotification(): remove uma notificação
 * - deleteRead(): remove todas as lidas
 * ============================================================================
 */

import { api } from './api';

/**
 * Interface para a resposta padrão da API.
 * O TransformInterceptor do NestJS envolve todos os dados no campo 'data'.
 */
interface ApiResponse<T> {
  /** Dados da resposta (o que realmente interessa) */
  data: T;
  /** Mensagem de status */
  message: string;
  /** Código HTTP de status */
  statusCode: number;
  /** Timestamp da resposta */
  timestamp: string;
}

/**
 * Tipos de notificação.
 */
export const NotificationType = {
  ACTION_REQUIRED: 'ACTION_REQUIRED',
  DOCUMENT_EXPIRING: 'DOCUMENT_EXPIRING',
  CERTIFICATION_EXPIRING: 'CERTIFICATION_EXPIRING',
  PASSWORD_EXPIRING: 'PASSWORD_EXPIRING',
  RECOMMENDED_ACTION: 'RECOMMENDED_ACTION',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  INFO: 'INFO',
  PROJECT_UPDATE: 'PROJECT_UPDATE',
  SYSTEM_UPDATE: 'SYSTEM_UPDATE',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/**
 * Prioridade das notificações.
 */
export const NotificationPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority];

/**
 * Interface de uma notificação.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  entity: string | null;
  entityId: string | null;
  metadata: Record<string, any> | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface de resposta paginada.
 */
export interface NotificationPaginatedResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Interface de filtros para busca de notificações.
 */
export interface NotificationFilters {
  search?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Busca uma notificação específica por ID.
 *
 * @param id - ID da notificação
 * @returns Promise com a notificação
 */
export async function getNotificationById(id: string): Promise<Notification> {
  const response = await api.get<ApiResponse<Notification>>(`/api/v1/notifications/${id}`);
  return response.data;
}

/**
 * Busca notificações paginadas do usuário autenticado.
 *
 * @param filters - Filtros de busca (opcional)
 * @returns Promise com notificações paginadas
 */
export async function getNotifications(filters?: NotificationFilters): Promise<NotificationPaginatedResponse> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.isRead !== undefined) params.append('isRead', String(filters.isRead));
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const queryString = params.toString();
  const response = await api.get<ApiResponse<NotificationPaginatedResponse>>(`/api/v1/notifications${queryString ? `?${queryString}` : ''}`);
  return response.data;
}

/**
 * Retorna a contagem de notificações não lidas.
 *
 * @returns Promise com contagem de não lidas
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  const response = await api.get<ApiResponse<{ count: number }>>('/api/v1/notifications/unread');
  return response.data;
}

/**
 * Marca uma notificação como lida.
 *
 * @param id - ID da notificação
 * @returns Promise com notificação atualizada
 */
export async function markAsRead(id: string): Promise<Notification> {
  const response = await api.patch<ApiResponse<Notification>>(`/api/v1/notifications/${id}`, { isRead: true });
  return response.data;
}

/**
 * Marca todas as notificações como lidas.
 *
 * @returns Promise com contagem de notificações atualizadas
 */
export async function markAllAsRead(): Promise<{ count: number }> {
  const response = await api.patch<ApiResponse<{ count: number }>>('/api/v1/notifications/read-all', {});
  return response.data;
}

/**
 * Remove uma notificação específica.
 *
 * @param id - ID da notificação
 * @returns Promise com notificação removida
 */
export async function deleteNotification(id: string): Promise<Notification> {
  const response = await api.delete<ApiResponse<Notification>>(`/api/v1/notifications/${id}`);
  return response.data;
}

/**
 * Remove todas as notificações lidas.
 *
 * @returns Promise com contagem de notificações removidas
 */
export async function deleteRead(): Promise<{ count: number }> {
  const response = await api.delete<ApiResponse<{ count: number }>>('/api/v1/notifications/read');
  return response.data;
}
