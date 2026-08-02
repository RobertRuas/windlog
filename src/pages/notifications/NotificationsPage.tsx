/**
 * ============================================================================
 * NOTIFICATIONS PAGE - Página de Notificações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página dedicada que exibe todas as notificações do usuário,
 * funcionando como uma "caixa de email" onde cada notificação
 * pode ser clicada para ver detalhes completos numa página dedicada.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Lista todas as notificações com filtros (lidas/não lidas)
 * - Ao clicar numa notificação, navega para /notifications/:id
 * - Marcar como lida/não lida
 * - Marcar todas como lidas
 * - Apagar notificações
 * - Design limpo e minimalista
 * ============================================================================
 */

import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Mail,
  MailOpen,
  ChevronRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
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
      return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' };
    case NotificationType.WARNING:
      return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' };
    case NotificationType.ERROR:
      return { icon: X, color: 'text-red-600', bg: 'bg-red-50' };
    case NotificationType.SUCCESS:
      return { icon: Check, color: 'text-green-500', bg: 'bg-green-50' };
    case NotificationType.PROFILE_INCOMPLETE:
      return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' };
    default:
      return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' };
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('all');

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
   * Navega para a página de detalhes da notificação.
   */
  const handleNotificationClick = (notification: Notification) => {
    // Se for notificação de perfil incompleto, adiciona hash para destacar o widget
    if (notification.type === 'PROFILE_INCOMPLETE') {
      navigate('/notifications/' + notification.id + '#complete-profile');
    } else {
      navigate(`/notifications/${notification.id}`);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Bell size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Notificações</h1>
              {data && (
                <p className="text-sm text-gray-500">
                  {data.total} {data.total === 1 ? 'notificação' : 'notificações'}
                </p>
              )}
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Marcar todas como lidas"
            >
              <CheckCheck size={18} />
            </button>
            <button
              onClick={() => deleteReadMutation.mutate()}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Limpar lidas"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail size={14} />
            Não lidas
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              filter === 'read'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MailOpen size={14} />
            Lidas
          </button>
        </div>

        {/* Lista de notificações */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">A carregar notificações...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
            <p className="text-gray-500">Erro ao carregar notificações</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              {filter === 'all'
                ? 'Nenhuma notificação'
                : filter === 'unread'
                ? 'Nenhuma notificação não lida'
                : 'Nenhuma notificação lida'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'all' && 'Quando tiver notificações, elas aparecerão aqui'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
              const priorityBorder = getPriorityBorder(notification.priority);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 border-l-4 ${priorityBorder} cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all ${
                    !notification.isRead ? 'ring-1 ring-blue-100' : ''
                  }`}
                >
                  {/* Ícone */}
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={color} />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`text-sm font-medium truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{getTypeLabel(notification.type)}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{formatRelativeDate(notification.createdAt)}</span>
                    </div>
                  </div>

                  {/* Seta e ações */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Marcar como lida"
                      >
                        <Check size={14} />
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
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} className="text-gray-400 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
