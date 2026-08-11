/**
 * ============================================================================
 * MESSAGE LIST - Lista de Mensagens com Busca Avançada
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Coluna central da caixa de correio: lista mensagens da pasta selecionada
 * com busca livre, filtros avançados (remetente, destinatário, assunto,
 * conteúdo, data, flags, anexos), carregamento infinito ao rolar e ações
 * rápidas por linha.
 * ============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Star, Paperclip, AlertTriangle, Search, SlidersHorizontal, X,
  MailOpen, Mail,
} from 'lucide-react';

// Serviço
import {
  getMailMessages,
  type MailMessageFilters, type MailMessageSummary,
} from '@/services/mail.service';

/**
 * Formata a data da mensagem (hoje → hora; caso contrário → data curta).
 */
function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Nome de exibição do remetente.
 */
function senderName(message: MailMessageSummary): string {
  const from = message.from?.[0];
  if (!from) return '—';
  return from.name || from.address;
}

/**
 * Props do componente MessageList.
 */
interface MessageListProps {
  /** Filtros ativos (pasta, etiqueta, busca) */
  filters: MailMessageFilters;
  /** Callback de alteração de filtros */
  onFiltersChange: (filters: MailMessageFilters) => void;
  /** Mensagem selecionada */
  selectedMessageId: string | null;
  /** Callback de seleção de mensagem */
  onSelectMessage: (message: MailMessageSummary) => void;
  /** Callback para atualizar flags inline (sinalizar) */
  onToggleFlag: (message: MailMessageSummary) => void;
  /** Mostrar campo de busca (controlado pelo pai) */
  showSearch: boolean;
}

/**
 * Componente MessageList - lista de mensagens com busca avançada.
 */
export function MessageList({
  filters,
  onFiltersChange,
  selectedMessageId,
  onSelectMessage,
  onToggleFlag,
  showSearch,
}: MessageListProps) {
  const { t } = useTranslation('mail');

  // Estado local da busca e painel de filtros avançados
  const [search, setSearch] = useState(filters.q || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advanced, setAdvanced] = useState({
    from: '', to: '', subject: '', content: '', startDate: '', endDate: '',
    unread: false, flagged: false, important: false, hasAttachments: false,
  });

  /**
   * Busca mensagens com os filtros ativos (refetch a cada 60s = sync contínua).
   * Paginação infinita: novas páginas são carregadas ao rolar até ao fim.
   */
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['mail-messages', filters],
    queryFn: ({ pageParam = 1 }) =>
      getMailMessages({ ...filters, page: pageParam, limit: filters.limit || 25 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    refetchInterval: 60_000,
  });

  /**
   * Mensagens acumuladas de todas as páginas carregadas.
   */
  const messages = data?.pages.flatMap((p) => p.data) || [];

  /**
   * Observador do elemento sentinela: dispara o carregamento da próxima
   * página quando o utilizador rola até ao fim da lista.
   */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /**
   * Aplica a busca livre.
   */
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    onFiltersChange({ ...filters, q: search || undefined });
  }

  /**
   * Aplica os filtros avançados.
   */
  function applyAdvanced() {
    onFiltersChange({
      ...filters,
      from: advanced.from || undefined,
      to: advanced.to || undefined,
      subject: advanced.subject || undefined,
      content: advanced.content || undefined,
      startDate: advanced.startDate ? new Date(advanced.startDate).toISOString() : undefined,
      endDate: advanced.endDate ? new Date(`${advanced.endDate}T23:59:59`).toISOString() : undefined,
      unread: advanced.unread || undefined,
      flagged: advanced.flagged || undefined,
      important: advanced.important || undefined,
      hasAttachments: advanced.hasAttachments || undefined,
    });
  }

  /**
   * Limpa todos os filtros avançados.
   */
  function clearAdvanced() {
    setAdvanced({
      from: '', to: '', subject: '', content: '', startDate: '', endDate: '',
      unread: false, flagged: false, important: false, hasAttachments: false,
    });
    onFiltersChange({
      ...filters,
      from: undefined, to: undefined, subject: undefined, content: undefined,
      startDate: undefined, endDate: undefined,
      unread: undefined, flagged: undefined, important: undefined, hasAttachments: undefined,
    });
  }

  /**
   * Classe de um campo do painel avançado.
   */
  const fieldClass = 'form-input text-sm';

  return (
    <div className="flex-1 min-w-0 border-r border-gray-200 dark:border-[#38383a] flex flex-col">
      {/* ── Barra de busca (aparece quando showSearch=true) ── */}
      {showSearch && (
        <div className="p-3 border-b border-gray-200 dark:border-[#38383a] space-y-2">
          <form onSubmit={handleSearch}>
            <div className="relative h-10">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('list.search_placeholder')}
                className="w-full h-full text-sm pl-8 pr-10 rounded-lg border border-gray-300 dark:border-[#38383a] bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md transition-colors ${
                  showAdvanced
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-[#a1a1a6]'
                }`}
                title={t('list.advanced_filters')}
              >
                <SlidersHorizontal size={15} />
              </button>
            </div>
          </form>

          {/* ── Filtros avançados ─────────────────────────────── */}
          {showAdvanced && (
            <div className="space-y-2 p-3 bg-gray-50 dark:bg-[#2c2c2e] rounded-lg">
              <input className={fieldClass} placeholder={t('list.filter_from')} value={advanced.from} onChange={(e) => setAdvanced({ ...advanced, from: e.target.value })} />
              <input className={fieldClass} placeholder={t('list.filter_to')} value={advanced.to} onChange={(e) => setAdvanced({ ...advanced, to: e.target.value })} />
              <input className={fieldClass} placeholder={t('list.filter_subject')} value={advanced.subject} onChange={(e) => setAdvanced({ ...advanced, subject: e.target.value })} />
              <input className={fieldClass} placeholder={t('list.filter_content')} value={advanced.content} onChange={(e) => setAdvanced({ ...advanced, content: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className={fieldClass} value={advanced.startDate} onChange={(e) => setAdvanced({ ...advanced, startDate: e.target.value })} title={t('list.filter_start_date')} />
                <input type="date" className={fieldClass} value={advanced.endDate} onChange={(e) => setAdvanced({ ...advanced, endDate: e.target.value })} title={t('list.filter_end_date')} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-600 dark:text-[#a1a1a6]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={advanced.unread} onChange={(e) => setAdvanced({ ...advanced, unread: e.target.checked })} />
                  {t('list.filter_unread')}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={advanced.flagged} onChange={(e) => setAdvanced({ ...advanced, flagged: e.target.checked })} />
                  {t('list.filter_flagged')}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={advanced.important} onChange={(e) => setAdvanced({ ...advanced, important: e.target.checked })} />
                  {t('list.filter_important')}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={advanced.hasAttachments} onChange={(e) => setAdvanced({ ...advanced, hasAttachments: e.target.checked })} />
                  {t('list.filter_attachments')}
                </label>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={applyAdvanced} className="form-button form-button-primary text-xs h-8 px-3">
                  {t('list.apply_filters')}
                </button>
                <button onClick={clearAdvanced} className="form-button form-button-secondary text-xs h-8 px-3">
                  {t('list.clear_filters')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Lista de mensagens ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && messages.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400 animate-pulse">{t('common:status.loading')}</p>
        ) : messages.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">{t('list.empty')}</p>
        ) : (
          messages.map((message) => {
            const active = selectedMessageId === message.id;
            return (
              <div
                key={message.id}
                onClick={() => onSelectMessage(message)}
                className={`
                  px-3 py-2.5 border-b border-gray-100 dark:border-[#2c2c2e] cursor-pointer transition-colors
                  ${active ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-[#1f1f21]'}
                `}
              >
                <div className="flex items-center gap-2">
                  {/* Indicador de lida/não lida */}
                  {message.isRead
                    ? <MailOpen size={14} className="text-gray-300 dark:text-[#38383a] flex-shrink-0" />
                    : <Mail size={14} className="text-blue-600 flex-shrink-0" />}

                  {/* Remetente */}
                  <span className={`flex-1 truncate text-sm ${message.isRead ? 'text-gray-600 dark:text-[#a1a1a6]' : 'font-semibold text-gray-900 dark:text-[#f5f5f7]'}`}>
                    {senderName(message)}
                  </span>

                  {/* Sinalizar */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFlag(message); }}
                    className="flex-shrink-0"
                    title={t('actions.flag')}
                  >
                    <Star
                      size={14}
                      className={message.isFlagged ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-[#38383a]'}
                    />
                  </button>

                  {/* Data */}
                  <span className="flex-shrink-0 text-xs text-gray-400">{formatDate(message.date)}</span>
                </div>

                {/* Assunto + indicadores */}
                <div className="flex items-center gap-1.5 mt-0.5 pl-6">
                  <span className={`truncate text-sm ${message.isRead ? 'text-gray-500 dark:text-[#8e8e93]' : 'font-medium text-gray-800 dark:text-[#f5f5f7]'}`}>
                    {message.subject || t('list.no_subject')}
                  </span>
                  {message.isDraft && (
                    <span className="flex-shrink-0 text-[10px] font-semibold text-red-500">{t('list.draft')}</span>
                  )}
                  {message.hasAttachments && <Paperclip size={12} className="flex-shrink-0 text-gray-400" />}
                  {message.hasSuspiciousAttachment && (
                    <span title={t('list.suspicious_attachment')} className="flex-shrink-0">
                      <AlertTriangle size={12} className="text-red-500" />
                    </span>
                  )}
                  {message.isImportant && <span className="flex-shrink-0 text-[10px] font-bold text-red-500">!</span>}
                </div>

                {/* Pré-visualização */}
                {message.preview && (
                  <p className="pl-6 mt-0.5 text-xs text-gray-400 dark:text-[#636366] truncate">{message.preview}</p>
                )}
              </div>
            );
          })
        )}

        {/* Sentinela do scroll infinito: carrega a próxima página ao rolar */}
        {hasNextPage && (
          <div ref={sentinelRef} className="p-3 text-center">
            {isFetchingNextPage && (
              <span className="text-xs text-gray-400 animate-pulse">{t('common:status.loading')}</span>
            )}
          </div>
        )}
      </div>

      {/* Botão limpar filtros ativos (quando há filtros avançados) */}
      {(filters.from || filters.unread || filters.flagged) && (
        <button
          onClick={clearAdvanced}
          className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border-t border-gray-200 dark:border-[#38383a]"
        >
          <X size={12} />
          {t('list.clear_filters')}
        </button>
      )}
    </div>
  );
}
