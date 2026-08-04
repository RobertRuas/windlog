/**
 * ============================================================================
 * NOTIFICATION HELPERS - Funções Auxiliares de Notificação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Centraliza funções auxiliares usadas nas páginas de notificação
 * (lista e detalhes) para manter consistência visual e evitar duplicação.
 *
 * FUNÇÕES:
 * --------
 * - getNotificationIcon: retorna ícone e cores por tipo de notificação
 * - getTypeLabel: retorna label legível em português do tipo
 * - getPriorityBorder: retorna classe da borda por prioridade (lista)
 * - getPriorityInfo: retorna label e cores por prioridade (detalhe)
 * ============================================================================
 */

import {
  AlertCircle,
  AlertTriangle,
  Check,
  Info,
  X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { NotificationType, NotificationPriority } from '@/services/notification.service';

/** Tipo retornado por getNotificationIcon */
export interface NotificationIconInfo {
  icon: ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  border?: string;
}

/**
 * Retorna ícone e cores baseado no tipo de notificação.
 * Usado tanto na lista quanto no detalhe para consistência visual.
 */
export function getNotificationIcon(type: NotificationType): NotificationIconInfo {
  switch (type) {
    case NotificationType.ACTION_REQUIRED:
    case NotificationType.DOCUMENT_EXPIRING:
    case NotificationType.CERTIFICATION_EXPIRING:
    case NotificationType.PASSWORD_EXPIRING:
      return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
    case NotificationType.WARNING:
      return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' };
    case NotificationType.ERROR:
      return { icon: X, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    case NotificationType.SUCCESS:
      return { icon: Check, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
    case NotificationType.PROFILE_INCOMPLETE:
      return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
    default:
      return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
  }
}

/**
 * Retorna label legível em português do tipo de notificação.
 */
export function getTypeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    ACTION_REQUIRED: 'Ação Obrigatória',
    DOCUMENT_EXPIRING: 'Documento a Expirar',
    CERTIFICATION_EXPIRING: 'Certificação a Expirar',
    PASSWORD_EXPIRING: 'Senha a Expirar',
    RECOMMENDED_ACTION: 'Ação Recomendada',
    PROFILE_INCOMPLETE: 'Perfil Incompleto',
    INFO: 'Informação',
    PROJECT_UPDATE: 'Atualização de Projeto',
    SYSTEM_UPDATE: 'Atualização do Sistema',
    SUCCESS: 'Sucesso',
    WARNING: 'Aviso',
    ERROR: 'Erro',
  };
  return labels[type] || 'Notificação';
}

/**
 * Retorna classe da borda esquerda baseado na prioridade (usado na lista).
 */
export function getPriorityBorder(priority: NotificationPriority): string {
  switch (priority) {
    case NotificationPriority.URGENT:
      return 'border-l-red-500';
    case NotificationPriority.HIGH:
      return 'border-l-orange-500';
    case NotificationPriority.MEDIUM:
      return 'border-l-blue-500';
    case NotificationPriority.LOW:
      return 'border-l-gray-300';
    default:
      return 'border-l-blue-500';
  }
}

/** Info retornada por getPriorityInfo */
export interface PriorityInfo {
  label: string;
  color: string;
  dot: string;
}

/**
 * Retorna label e cores baseado na prioridade (usado no detalhe).
 */
export function getPriorityInfo(priority: NotificationPriority): PriorityInfo {
  switch (priority) {
    case NotificationPriority.URGENT:
      return { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' };
    case NotificationPriority.HIGH:
      return { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' };
    case NotificationPriority.MEDIUM:
      return { label: 'Média', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
    case NotificationPriority.LOW:
      return { label: 'Baixa', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
    default:
      return { label: 'Média', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
  }
}
