/**
 * ============================================================================
 * NOTIFICATIONS PAGE - Página de Notificações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página dedicada que exibe todas as notificações do usuário,
 * funcionando como uma "caixa de email" onde cada notificação
 * pode ser aberta para ver detalhes completos.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Lista todas as notificações com filtros (lidas/não lidas)
 * - Ao clicar numa notificação, abre modal com detalhes completos
 * - Marcar como lida/não lida
 * - Marcar todas como lidas
 * - Apagar notificações
 * - Paginação para muitas notificações
 * ============================================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Filter,
  Mail,
  MailOpen,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { NotificationDetailModal } from '@/components/notifications/NotificationDetailModal';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteRead,
  NotificationType,
  NotificationPriority,
  type Notification,
} from '@/services/notification.service';

/**
 * Formata data relativa (ex: "há 2 horas").
 */
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHrs < 24) return `há ${diffHrs}h`;
  if (diffDays < 7) return `há ${diffDays}d`;
  return date.toLocaleDateString('pt-PT');
}

/**
 * Retorna ícone e cor baseado no tipo de notificação.
 */
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.ACTION_REQUIRED:
    case NotificationType.DOCUMENT_EXPIRING:
    case NotificationType.CERTIFICATION_EXPIRING:
    case NotificationType.PASSWORD_EXPIRING:
      return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100' };
    case NotificationType.WARNING:
      return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100' };
    case NotificationType.ERROR:
      return { icon: X, color: 'text-red-600', bg: 'bg-red-100' };
    case NotificationType.SUCCESS:
      return { icon: Check, color: 'text-green-500', bg: 'bg-green-100' };
    case NotificationType.PROFILE_INCOMPLETE:
      return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100' };
    default:
      return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100' };
  }
}

/**
 * Retorna cor da borda esquerda baseado na prioridade.
 */
function getPriorityBorder(priority: NotificationPriority): string {
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

/**
 * Retorna label do tipo de notificação.
 */
function getTypeLabel(type: NotificationType): string {
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

type FilterType = 'all' | 'unread' | 'read';

/**
 * Componente NotificationsPage - Página de notificações.
 */
export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  /**
   * Busca notificações.
   */
  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () =>
      getNotifications({
        isRead: filter === 'all' ? undefined : filter === 'read',
        limit: 50,
      }),
  });

  const notifications = data?.data || [];

  /**
   * Mutation: marcar como lida.
   */
  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  /**
   * Mutation: marcar todas como lidas.
   */
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  /**
   * Mutation: apagar notificação.
   */
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  /**
   * Mutation: apagar todas as lidas.
   */
  const deleteReadMutation = useMutation({
    mutationFn: deleteRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  /**
   * Handle click em uma notificação.
   */
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    setSelectedNotification(notification);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell size={28} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
            {data && (
              <span className="text-sm text-gray-500">
                ({data.total} {data.total === 1 ? 'notificação' : 'notificações'})
              </span>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Marcar todas como lidas"
            >
              <CheckCheck size={16} />
              <span className="hidden sm:inline">Marcar todas como lidas</span>
            </button>
            <button
              onClick={() => deleteReadMutation.mutate()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Limpar lidas"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Limpar lidas</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-gray-400" />
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'unread' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-1">
                <Mail size={14} />
                Não lidas
              </span>
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'read' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-1">
                <MailOpen size={14} />
                Lidas
              </span>
            </button>
          </div>
        </div>

        {/* Lista de notificações */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">A carregar...</div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">Erro ao carregar notificações</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {filter === 'all'
                ? 'Nenhuma notificação'
                : filter === 'unread'
                ? 'Nenhuma notificação não lida'
                : 'Nenhuma notificação lida'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification: Notification) => {
              const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
              const priorityBorder = getPriorityBorder(notification.priority);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`relative flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 border-l-4 ${priorityBorder} cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'ring-1 ring-blue-200' : ''
                  }`}
                >
                  {/* Ícone */}
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={color} />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`text-sm font-semibold truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-400">{getTypeLabel(notification.type)}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{formatRelativeDate(notification.createdAt)}</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Marcar como lida"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotificationMutation.mutate(notification.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                      title="Apagar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalhes da notificação */}
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </AppLayout>
  );
}
