/**
 * ============================================================================
 * MAIL INBOX - Caixa de Correio (lista/leitura + atalhos de teclado)
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Layout principal do cliente de e-mail após a conta conectada:
 * - Barra de ferramentas: escrever, sincronizar, gestão, desconectar
 * - Área principal: lista de mensagens (MessageList) OU leitura da
 *   mensagem em tela cheia (MessageView), com botão de voltar
 * - Pastas e etiquetas ficam no submenu em acordeão do menu lateral
 *   principal (a seleção chega via query string ?folder= / ?label=)
 *
 * ATALHOS DE TECLADO:
 * -------------------
 * - c: nova mensagem | r: sincronizar | Esc: fechar seleção/modais
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PenSquare, RefreshCw, Settings2, PlugZap } from 'lucide-react';

// Serviço
import {
  syncMail, disconnectMailAccount, updateMessageFlags,
  type MailAccount, type MailMessageFilters, type MailMessageSummary,
  type MailMessageDetail,
} from '@/services/mail.service';

// Componentes do módulo
import { MessageList } from './MessageList';
import { MessageView } from './MessageView';
import { ComposeModal, type ComposeMode } from './ComposeModal';
import { MailManagementDialog } from './MailManagementDialog';

/**
 * Estado dos modais abertos.
 */
interface ModalState {
  compose: { mode: ComposeMode; original?: MailMessageDetail | null } | null;
  management: { tab?: 'contacts' | 'rules' | 'labels' | 'signatures' | 'autoreply' | 'blocked' } | null;
}

/**
 * Props do componente MailInbox.
 */
interface MailInboxProps {
  /** Conta conectada do usuário */
  account: MailAccount;
}

/**
 * Componente MailInbox - caixa de correio completa.
 */
export function MailInbox({ account }: MailInboxProps) {
  const { t } = useTranslation('mail');
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Pasta/etiqueta selecionada vem da query string (submenu do menu lateral)
  const folderId = searchParams.get('folder');
  const labelId = searchParams.get('label');

  // Estado de filtros e seleção
  const [filters, setFilters] = useState<MailMessageFilters>({});
  const [selectedMessage, setSelectedMessage] = useState<MailMessageSummary | null>(null);
  const [modals, setModals] = useState<ModalState>({ compose: null, management: null });

  /**
   * Ao trocar de pasta/etiqueta, fecha a leitura da mensagem atual.
   */
  useEffect(() => {
    setSelectedMessage(null);
  }, [folderId, labelId]);

  /**
   * Filtros efetivos = pasta/etiqueta selecionada + filtros da lista.
   */
  const effectiveFilters: MailMessageFilters = {
    ...filters,
    folderId: folderId || undefined,
    labelId: labelId || undefined,
  };

  /**
   * Invalida as listas de mensagens e pastas.
   */
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
    queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
  }, [queryClient]);

  /**
   * Sincronização manual.
   */
  const syncMutation = useMutation({
    mutationFn: syncMail,
    onSuccess: (result) => {
      invalidateAll();
      toast.success(t('toolbar.synced', { count: result.newMessages }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Desconectar conta.
   */
  const disconnectMutation = useMutation({
    mutationFn: disconnectMailAccount,
    onSuccess: () => {
      toast.success(t('toolbar.disconnected'));
      queryClient.invalidateQueries({ queryKey: ['mail-account'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Alternar flag de sinalização inline na lista.
   */
  async function handleToggleFlag(message: MailMessageSummary) {
    try {
      await updateMessageFlags(message.id, { isFlagged: !message.isFlagged });
      invalidateAll();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  /**
   * Abre o compose num modo específico.
   */
  function openCompose(mode: ComposeMode, original?: MailMessageDetail | null) {
    setModals({ ...modals, compose: { mode, original } });
  }

  /**
   * Atalhos de teclado do módulo.
   * Ignora quando o foco está em inputs/textareas ou há modal aberto.
   */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      // Esc fecha seleção ou modais (funciona mesmo a escrever)
      if (e.key === 'Escape') {
        if (modals.compose || modals.management) {
          setModals({ compose: null, management: null });
        } else {
          setSelectedMessage(null);
        }
        return;
      }

      if (isTyping || modals.compose || modals.management) return;

      // c → nova mensagem
      if (e.key === 'c') {
        e.preventDefault();
        openCompose('new');
      }
      // r → sincronizar
      if (e.key === 'r') {
        e.preventDefault();
        syncMutation.mutate();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modals, selectedMessage]);

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#38383a] overflow-hidden">
      {/* ── Barra de ferramentas ───────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-[#38383a]">
        {/* Escrever */}
        <button
          onClick={() => openCompose('new')}
          className="form-button form-button-primary inline-flex items-center gap-2"
          title={`${t('toolbar.compose')} (c)`}
        >
          <PenSquare size={15} />
          {t('toolbar.compose')}
        </button>

        {/* Sincronizar */}
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="form-button form-button-secondary inline-flex items-center gap-2"
          title={`${t('toolbar.sync')} (r)`}
        >
          <RefreshCw size={15} className={syncMutation.isPending ? 'animate-spin' : ''} />
          {t('toolbar.sync')}
        </button>

        {/* Informações da conta */}
        <span className="ml-2 text-xs text-gray-400 dark:text-[#636366] truncate" title={account.email}>
          {account.email} · {account.protocol}
          {account.lastSyncAt && (
            <> · {t('toolbar.last_sync')}: {new Date(account.lastSyncAt).toLocaleTimeString()}</>
          )}
        </span>

        {/* Gestão (regras, contatos, assinaturas...) */}
        <button
          onClick={() => setModals({ ...modals, management: {} })}
          className="ml-auto form-button form-button-secondary inline-flex items-center gap-2"
          title={t('toolbar.manage')}
        >
          <Settings2 size={15} />
        </button>

        {/* Desconectar */}
        <button
          onClick={() => disconnectMutation.mutate()}
          className="form-button form-button-secondary inline-flex items-center gap-2 !text-red-600"
          title={t('toolbar.disconnect')}
        >
          <PlugZap size={15} />
        </button>
      </div>

      {/* Erro da última sincronização */}
      {account.lastSyncError && (
        <div className="px-4 py-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border-b border-gray-200 dark:border-[#38383a]">
          {t('toolbar.sync_error')}: {account.lastSyncError}
        </div>
      )}

      {/* ── Corpo: lista OU leitura em tela cheia ───────────── */}
      <div className="flex h-[calc(100vh-260px)] min-h-[480px]">
        {selectedMessage ? (
          <MessageView
            message={selectedMessage}
            onBack={() => setSelectedMessage(null)}
            onCompose={(mode, original) => openCompose(mode, original)}
            onChanged={() => { setSelectedMessage(null); invalidateAll(); }}
          />
        ) : (
          <MessageList
            filters={effectiveFilters}
            onFiltersChange={(next) => setFilters({ ...next, folderId: undefined, labelId: undefined })}
            selectedMessageId={null}
            onSelectMessage={setSelectedMessage}
            onToggleFlag={handleToggleFlag}
          />
        )}
      </div>

      {/* ── Modais ─────────────────────────────────────────── */}
      {modals.compose && (
        <ComposeModal
          mode={modals.compose.mode}
          original={modals.compose.original}
          onClose={() => setModals({ ...modals, compose: null })}
          onSent={invalidateAll}
        />
      )}
      {modals.management && (
        <MailManagementDialog
          initialTab={modals.management.tab}
          onClose={() => setModals({ ...modals, management: null })}
        />
      )}
    </div>
  );
}
