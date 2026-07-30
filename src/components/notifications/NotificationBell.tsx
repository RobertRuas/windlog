/**
 * ============================================================================
 * NOTIFICATION BELL - Ícone de Sino com Contador de Notificações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe um ícone de sino com badge mostrando quantidade
 * de notificações não lidas. Ao clicar, abre o painel de notificações.
 *
 * COMO FUNCIONA?
 * --------------
 * - Busca contagem de não lidas da API ao montar
 * - Exibe badge vermelho com número de não lidas
 * - Ao clicar, alterna visibilidade do NotificationPanel
 * - Polling a cada 30 segundos para atualizar contagem
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check } from 'lucide-react';
import { getUnreadCount, markAllAsRead } from '@/services/notification.service';
import { NotificationPanel } from './NotificationPanel';

/**
 * Componente NotificationBell - Sino de notificações com contador.
 */
export function NotificationBell() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Busca contagem de notificações não lidas.
   * Refetch a cada 30 segundos para manter atualizado.
   */
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadCount,
    refetchInterval: 30000, // 30 segundos
  });

  /**
   * Mutation para marcar todas como lidas.
   */
  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = unreadData?.count ?? 0;

  /**
   * Alterna visibilidade do painel.
   */
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  /**
   * Fecha o painel.
   */
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Marca todas como lidas.
   */
  const handleMarkAllRead = useCallback(() => {
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  // Fecha o painel ao clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('[data-notification-container]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" data-notification-container>
      {/* Botão do sino */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {/* Badge com contagem de não lidas */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel dropdown de notificações */}
      {isOpen && (
        <NotificationPanel
          onClose={handleClose}
          onMarkAllRead={handleMarkAllRead}
        />
      )}
    </div>
  );
}
