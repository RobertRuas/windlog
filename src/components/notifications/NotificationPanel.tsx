/**
 * ============================================================================
 * NOTIFICATION PANEL - Painel Dropdown de Notificações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente dropdown que exibe lista de notificações recentes.
 * Permite marcar como lida, remover e navegar para detalhes.
 *
 * COMO FUNCIONA?
 * --------------
 * - Exibe últimas 10 notificações (não lidas primeiro)
 * - Cada notificação mostra: ícone, título, mensagem, tempo
 * - Ao clicar, marca como lida automaticamente
 * - Botão "Ver todas" para página completa (futuro)
 * - Botão "Marcar todas como lidas" no cabeçalho
 * ============================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCheck, Trash2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  deleteNotification,
  deleteRead,
  NotificationType,
  NotificationPriority,
  type Notification,
} from '@/services/notification.service';

/**
 * Props do componente NotificationPanel.
 */
interface NotificationPanelProps {
  /** Callback para fechar o painel */
  onClose: () => void;
  /** Callback para marcar todas como lidas */
  onMarkAllRead: () => void;
}

/**
 * Formata tempo relativo (ex: "há 5 minutos").
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  if (diffHour < 24) return `há ${diffHour}h`;
  if (diffDay < 7) return `há ${diffDay}d`;
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
    default:
      return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' };
  }
}

/**
 * Retorna cor da borda baseado na prioridade.
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
      return 'border-l-gray-300';
  }
}

/**
 * Componente NotificationPanel - Dropdown de notificações.
 */
export function NotificationPanel({ onClose, onMarkAllRead }: NotificationPanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /**
   * Busca notificações (últimas 10).
   */
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => getNotifications({ limit: 10 }),
  });

  /**
   * Mutation para marcar uma notificação como lida.
   */
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  /**
   * Mutation para remover uma notificação.
   */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  /**
   * Mutation para remover todas as lidas.
   */
  const deleteReadMutation = useMutation({
    mutationFn: deleteRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.data ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  /**
   * Handle click em uma notificação.
   */
  const handleNotificationClick = (notification: Notification) => {
    // Marca como lida se não for
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navega para entidade relacionada se disponível
    if (notification.entity && notification.entityId) {
      switch (notification.entity) {
        case 'Project':
          navigate(`/projects/${notification.entityId}`);
          break;
        case 'User':
          navigate(`/profile`);
          break;
      }
      onClose();
    }
  };

  /**
   * Remove uma notificação (stop propagation).
   */
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              title="Marcar todas como lidas"
            >
              <CheckCheck size={14} />
              <span>Marcar todas</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 text-gray-500"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Lista de notificações */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            A carregar...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            Sem notificações
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
              const priorityBorder = getPriorityBorder(notification.priority);

              return (
                <li
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    flex items-start gap-3 px-4 py-3 cursor-pointer
                    hover:bg-gray-50 transition-colors
                    border-l-4 ${priorityBorder}
                    ${!notification.isRead ? 'bg-blue-50/30' : ''}
                  `}
                >
                  {/* Ícone da notificação */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bg} flex items-center justify-center`}>
                    <Icon size={16} className={color} />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Botão remover */}
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="flex-shrink-0 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Rodapé */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <button
            onClick={() => {
              deleteReadMutation.mutate();
            }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Limpar lidas
          </button>
          <span className="text-xs text-gray-400">
            {notifications.length} {notifications.length === 1 ? 'notificação' : 'notificações'}
          </span>
        </div>
      )}
    </div>
  );
}
