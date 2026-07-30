/**
 * ============================================================================
 * NOTIFICATION DETAIL MODAL - Modal de Detalhes da Notificação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Modal que exibe detalhes completos de uma notificação.
 * Funciona como uma "caixa de email" - ao clicar numa notificação,
 * abre este modal com informações mais completas.
 *
 * COMO FUNCIONA?
 * --------------
 * - Exibe título, mensagem, tipo, prioridade e data
 * - Mostra ícone baseado no tipo de notificação
 * - Cor da borda baseada na prioridade
 * - Botão para fechar o modal
 * - Botão para navegar para a entidade relacionada (se disponível)
 * ============================================================================
 */

import { useNavigate } from 'react-router-dom';
import {
  X,
  AlertCircle,
  Info,
  AlertTriangle,
  Check,
  Calendar,
  Tag,
  Flag,
  ExternalLink,
} from 'lucide-react';
import {
  NotificationType,
  NotificationPriority,
  type Notification,
} from '@/services/notification.service';

/**
 * Props do componente NotificationDetailModal.
 */
interface NotificationDetailModalProps {
  /** Notificação a ser exibida */
  notification: Notification;
  /** Callback para fechar o modal */
  onClose: () => void;
}

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
 * Retorna label e cor baseado na prioridade.
 */
function getPriorityInfo(priority: NotificationPriority) {
  switch (priority) {
    case NotificationPriority.URGENT:
      return { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200' };
    case NotificationPriority.HIGH:
      return { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    case NotificationPriority.MEDIUM:
      return { label: 'Média', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    case NotificationPriority.LOW:
      return { label: 'Baixa', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    default:
      return { label: 'Média', color: 'bg-blue-100 text-blue-700 border-blue-200' };
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
 * Componente NotificationDetailModal - Modal de detalhes da notificação.
 */
export function NotificationDetailModal({
  notification,
  onClose,
}: NotificationDetailModalProps) {
  const navigate = useNavigate();
  const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
  const priorityInfo = getPriorityInfo(notification.priority);

  /**
   * Navega para a entidade relacionada.
   */
  const handleNavigate = () => {
    if (notification.entity && notification.entityId) {
      switch (notification.entity) {
        case 'Project':
          navigate(`/projects/${notification.entityId}`);
          break;
        case 'User':
          navigate('/profile');
          break;
      }
      onClose();
    }
  };

  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com gradiente baseado no tipo */}
          <div className={`${bg} px-6 py-5 border-b border-gray-200`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Ícone grande */}
                <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center border-2 border-white/50`}>
                  <Icon size={24} className={color} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {notification.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {getTypeLabel(notification.type)}
                  </p>
                </div>
              </div>
              {/* Botão fechar */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/50 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="px-6 py-5 space-y-4">
            {/* Mensagem */}
            <div>
              <p className="text-gray-700 leading-relaxed">
                {notification.message}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
              {/* Prioridade */}
              <div className="flex items-center gap-1.5">
                <Flag size={14} className="text-gray-400" />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priorityInfo.color}`}>
                  {priorityInfo.label}
                </span>
              </div>

              {/* Data */}
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">
                  {formatFullDate(notification.createdAt)}
                </span>
              </div>

              {/* Estado */}
              <div className="flex items-center gap-1.5">
                <Tag size={14} className="text-gray-400" />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${notification.isRead ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                  {notification.isRead ? 'Lida' : 'Não lida'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer com ações */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Fechar
            </button>

            {/* Botão para navegar para entidade relacionada */}
            {notification.entity && notification.entityId && (
              <button
                onClick={handleNavigate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink size={14} />
                {notification.entity === 'User' ? 'Ir para Perfil' : 'Ver Detalhes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
