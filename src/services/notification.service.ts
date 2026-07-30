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
  return api.get<NotificationPaginatedResponse>(`/api/v1/notifications${queryString ? `?${queryString}` : ''}`);
}

/**
 * Retorna a contagem de notificações não lidas.
 *
 * @returns Promise com contagem de não lidas
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  return api.get<{ count: number }>('/api/v1/notifications/unread');
}

/**
 * Marca uma notificação como lida.
 *
 * @param id - ID da notificação
 * @returns Promise com notificação atualizada
 */
export async function markAsRead(id: string): Promise<Notification> {
  return api.patch<Notification>(`/api/v1/notifications/${id}`, { isRead: true });
}

/**
 * Marca todas as notificações como lidas.
 *
 * @returns Promise com contagem de notificações atualizadas
 */
export async function markAllAsRead(): Promise<{ count: number }> {
  return api.patch<{ count: number }>('/api/v1/notifications/read-all', {});
}

/**
 * Remove uma notificação específica.
 *
 * @param id - ID da notificação
 * @returns Promise com notificação removida
 */
export async function deleteNotification(id: string): Promise<Notification> {
  return api.delete<Notification>(`/api/v1/notifications/${id}`);
}

/**
 * Remove todas as notificações lidas.
 *
 * @returns Promise com contagem de notificações removidas
 */
export async function deleteRead(): Promise<{ count: number }> {
  return api.delete<{ count: number }>('/api/v1/notifications/read');
}
