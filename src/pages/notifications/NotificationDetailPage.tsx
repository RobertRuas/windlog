/**
 * ============================================================================
 * NOTIFICATION DETAIL PAGE - Página de Detalhes da Notificação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Página que exibe detalhes completos de uma notificação específica.
 * Acessada via /notifications/:id
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Exibe todos os detalhes da notificação
 * - Marca automaticamente como lida ao abrir
 * - Botão para voltar à lista
 * - Botão para navegar à entidade relacionada (perfil, projeto, etc.)
 * - Design limpo e minimalista
 * ============================================================================
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertCircle,
  Info,
  AlertTriangle,
  Check,
  X,
  Calendar,
  Flag,
  Tag,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  getNotificationById,
  markAsRead,
  deleteNotification,
  NotificationType,
  NotificationPriority,
} from '@/services/notification.service';

/**
 * Formata data completa (ex: "30 de julho de 2026, 14:30").
 */
function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
      return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', border: 'border-red-200' };
    case NotificationType.WARNING:
      return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100', border: 'border-amber-200' };
    case NotificationType.ERROR:
      return { icon: X, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
    case NotificationType.SUCCESS:
      return { icon: Check, color: 'text-green-500', bg: 'bg-green-100', border: 'border-green-200' };
    case NotificationType.PROFILE_INCOMPLETE:
      return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-200' };
    default:
      return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-200' };
  }
}

/**
 * Retorna label e cor baseado na prioridade.
 */
function getPriorityInfo(priority: NotificationPriority) {
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

/**
 * Componente NotificationDetailPage - Página de detalhes da notificação.
 */
export function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /**
   * Busca a notificação por ID.
   */
  const { data: notification, isLoading, isError } = useQuery({
    queryKey: ['notification', id],
    queryFn: () => getNotificationById(id!),
    enabled: !!id,
  });

  /**
   * Mutation: marcar como lida.
   */
  const markAsReadMutation = useMutation({
    mutationFn: () => markAsRead(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification', id] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  /**
   * Mutation: apagar notificação.
   */
  const deleteNotificationMutation = useMutation({
    mutationFn: () => deleteNotification(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      navigate('/notifications');
    },
  });

  /**
   * Marca como lida ao abrir a página (se não for lida).
   */
  if (notification && !notification.isRead && !markAsReadMutation.isPending) {
    markAsReadMutation.mutate();
  }

  /**
   * Navega para a entidade relacionada.
   */
  const handleNavigateToEntity = () => {
    if (!notification?.entity || !notification?.entityId) return;
    
    switch (notification.entity) {
      case 'Project':
        navigate(`/projects/${notification.entityId}`);
        break;
      case 'User':
        // Se for notificação de perfil incompleto, adiciona hash para destacar o widget
        if (notification.type === 'PROFILE_INCOMPLETE') {
          navigate('/profile#complete-profile');
        } else {
          navigate('/profile');
        }
        break;
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12 text-gray-500">A carregar...</div>
        </div>
      </AppLayout>
    );
  }

  if (isError || !notification) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
            <p className="text-gray-500">Notificação não encontrada</p>
            <button
              onClick={() => navigate('/notifications')}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Voltar para notificações
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { icon: Icon, color, bg, border } = getNotificationIcon(notification.type);
  const priorityInfo = getPriorityInfo(notification.priority);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Detalhes da Notificação</h1>
        </div>

        {/* Card da notificação */}
        <div className={`bg-white rounded-2xl border ${border} overflow-hidden shadow-sm`}>
          {/* Header colorido */}
          <div className={`${bg} px-6 py-5 border-b ${border}`}>
            <div className="flex items-start gap-4">
              {/* Ícone grande */}
              <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center border-2 border-white/50 flex-shrink-0`}>
                <Icon size={28} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  {notification.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {getTypeLabel(notification.type)}
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="px-6 py-5 space-y-5">
            {/* Mensagem */}
            <div>
              <p className="text-gray-700 leading-relaxed text-base">
                {notification.message}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
              {/* Prioridade */}
              <div className="flex items-center gap-2">
                <Flag size={16} className="text-gray-400" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${priorityInfo.dot}`} />
                  <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full border ${priorityInfo.color}`}>
                    {priorityInfo.label}
                  </span>
                </div>
              </div>

              {/* Data */}
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {formatFullDate(notification.createdAt)}
                </span>
              </div>

              {/* Estado */}
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-gray-400" />
                <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                  notification.isRead 
                    ? 'bg-gray-100 text-gray-600 border border-gray-200' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {notification.isRead ? 'Lida' : 'Não lida'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer com ações */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={() => navigate('/notifications')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Voltar
            </button>

            <div className="flex items-center gap-2">
              {/* Botão apagar */}
              <button
                onClick={() => deleteNotificationMutation.mutate()}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                <span>Apagar</span>
              </button>

              {/* Botão para navegar para entidade relacionada */}
              {notification.entity && notification.entityId && (
                <button
                  onClick={handleNavigateToEntity}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink size={16} />
                  {notification.entity === 'User' ? 'Ir para Perfil' : 'Ver Detalhes'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
