/**
 * ============================================================================
 * NOTIFICATION BELL - Ícone de Sino com Contador de Notificações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe um ícone de sino com badge mostrando quantidade
 * de notificações não lidas. Ao clicar, navega para a página de notificações.
 *
 * COMO FUNCIONA?
 * --------------
 * - Busca contagem de não lidas da API ao montar
 * - Exibe badge vermelho com número de não lidas
 * - Ao clicar, navega para /notifications
 * - Polling a cada 30 segundos para atualizar contagem
 * ============================================================================
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '@/services/notification.service';

/**
 * Componente NotificationBell - Sino de notificações com contador.
 */
export function NotificationBell() {
  const navigate = useNavigate();
  const { t } = useTranslation('notifications');

  /**
   * Busca contagem de notificações não lidas.
   * Refetch a cada 30 segundos para manter atualizado.
   */
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadCount,
    refetchInterval: 30000, // 30 segundos
  });

  const unreadCount = unreadData?.count ?? 0;

  /**
   * Navega para a página de notificações.
   */
  const handleClick = () => {
    navigate('/notifications');
  };

  // Atualiza o título da página com contagem de não lidas
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Windlog`;
    } else {
      document.title = 'Windlog';
    }
    return () => {
      document.title = 'Windlog';
    };
  }, [unreadCount]);

  return (
    <button
      onClick={handleClick}
      className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
      aria-label={t('ariaLabels.notifications')}
    >
      <Bell size={20} />
      {/* Badge com contagem de não lidas */}
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
