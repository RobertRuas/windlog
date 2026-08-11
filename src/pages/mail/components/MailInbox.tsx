/**
 * ============================================================================
 * MAIL INBOX - Caixa de Correio (lista/leitura + atalhos de teclado)
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Layout principal do cliente de e-mail após a conta conectada:
 * - Barra de ferramentas: escrever, sincronizar, gestão, desconectar
 * - Barra de navegação discreta: pastas e etiquetas (seleção via query string)
 * - Área principal: lista de mensagens (MessageList) OU leitura da
 *   mensagem em tela cheia (MessageView), com botão de voltar
 *
 * ATALHOS DE TECLADO:
 * -------------------
 * - c: nova mensagem | r: sincronizar | Esc: fechar seleção/modais
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  PenSquare, RefreshCw, Settings2, PlugZap, Search,
  Inbox, Send, FileText, AlertOctagon, Trash2, Archive,
  Folder as FolderIcon, Tag, Plus,
} from 'lucide-react';

// Serviço
import {
  syncMail, disconnectMailAccount, updateMessageFlags,
  getMailFolders, getMailLabels, createMailFolder,
  type MailAccount, type MailFolder, type MailFolderType, type MailLabel,
  type MailMessageFilters, type MailMessageSummary,
  type MailMessageDetail,
} from '@/services/mail.service';

// Componentes do módulo
import { MessageList } from './MessageList';
import { MessageView } from './MessageView';
import { ComposeModal, type ComposeMode } from './ComposeModal';
import { MailManagementDialog } from './MailManagementDialog';

/**
 * Ícone de cada tipo de pasta.
 */
const FOLDER_ICONS: Record<MailFolderType, typeof Inbox> = {
  INBOX: Inbox,
  SENT: Send,
  DRAFTS: FileText,
  SPAM: AlertOctagon,
  TRASH: Trash2,
  ARCHIVE: Archive,
  CUSTOM: FolderIcon,
};

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
  const [searchParams, setSearchParams] = useSearchParams();

  // Pasta/etiqueta selecionada vem da query string
  const folderId = searchParams.get('folder');
  const labelId = searchParams.get('label');
  // Vista da caixa de entrada: 'all' ou 'unread'
  const inboxView = searchParams.get('inboxView') || 'all';

  // Estado de filtros e seleção
  const [filters, setFilters] = useState<MailMessageFilters>({});
  const [selectedMessage, setSelectedMessage] = useState<MailMessageSummary | null>(null);
  const [modals, setModals] = useState<ModalState>({ compose: null, management: null });

  // Estado para criação inline de pasta
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Estado da busca (mostrar/esconder campo)
  const [showSearch, setShowSearch] = useState(false);

  /**
   * Busca pastas e etiquetas para a barra de navegação.
   * Refetch automático a cada 5 minutos para verificar novos e-mails.
   */
  const { data: folders = [], dataUpdatedAt: foldersUpdatedAt } = useQuery({
    queryKey: ['mail-folders'],
    queryFn: getMailFolders,
    staleTime: 30_000,
    refetchInterval: 5 * 60_000, // 5 minutos
  });
  const { data: labels = [] } = useQuery({
    queryKey: ['mail-labels'],
    queryFn: getMailLabels,
    staleTime: 30_000,
    refetchInterval: 5 * 60_000,
  });

  /**
   * Aplica a seleção (pasta ou etiqueta) na query string.
   */
  function selectFolder(key: 'folder' | 'label', value: string | null) {
    const next = new URLSearchParams(searchParams);
    next.delete('folder');
    next.delete('label');
    next.delete('inboxView');
    if (value) next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  /**
   * Define a vista da caixa de entrada (all/unread).
   */
  function selectInboxView(view: 'all' | 'unread') {
    const next = new URLSearchParams(searchParams);
    if (view === 'all') {
      next.delete('inboxView');
    } else {
      next.set('inboxView', view);
    }
    setSearchParams(next, { replace: true });
  }

  /**
   * Cria uma pasta personalizada.
   */
  const createFolderMutation = useMutation({
    mutationFn: (name: string) => createMailFolder(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
      setIsAddingFolder(false);
      setNewFolderName('');
      toast.success(t('folders.created'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Ao trocar de pasta/etiqueta, fecha a leitura da mensagem atual.
   */
  useEffect(() => {
    setSelectedMessage(null);
  }, [folderId, labelId]);

  /**
   * Abre o diálogo de gestão quando a URL contém ?manage=1
   * (disparado pelo item "Configurações" do submenu no menu lateral).
   */
  useEffect(() => {
    if (searchParams.get('manage') === '1') {
      setModals((prev) => ({ ...prev, management: {} }));
      const next = new URLSearchParams(searchParams);
      next.delete('manage');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  /**
   * Filtros efetivos = pasta/etiqueta selecionada + filtros da lista.
   * Quando a caixa de entrada está em vista "não lidas", aplica unread=true.
   */
  const effectiveFilters: MailMessageFilters = {
    ...filters,
    folderId: folderId || undefined,
    labelId: labelId || undefined,
    unread: inboxView === 'unread' ? true : undefined,
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
    <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#38383a] overflow-hidden flex flex-col flex-1 min-h-0">
      {/* ── Barra de ferramentas ───────────────────────────── */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-gray-200 dark:border-[#38383a]">
        {/* Escrever (apenas ícone) */}
        <button
          onClick={() => openCompose('new')}
          className="form-button form-button-primary"
          title={`${t('toolbar.compose')} (c)`}
        >
          <PenSquare size={15} />
        </button>

        {/* Sincronizar (apenas ícone) */}
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="form-button form-button-secondary"
          title={`${t('toolbar.sync')} (r)`}
        >
          <RefreshCw size={15} className={syncMutation.isPending ? 'animate-spin' : ''} />
        </button>

        {/* Buscar (mostra/esconde campo de busca) */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`form-button form-button-secondary ${showSearch ? '!bg-blue-50 dark:!bg-blue-900/20 !text-blue-600 dark:!text-blue-400' : ''}`}
          title={t('toolbar.search')}
        >
          <Search size={15} />
        </button>

        {/* Informações da conta (oculto no telemóvel para poupar espaço) */}
        <span className="hidden sm:inline ml-2 text-xs text-gray-400 dark:text-[#636366] truncate" title={account.email}>
          {account.email} · {account.protocol}
          {account.lastSyncAt && (
            <> · {t('toolbar.last_sync')}: {new Date(account.lastSyncAt).toLocaleTimeString()}</>
          )}
        </span>

        {/* Gestão (regras, contatos, assinaturas...) */}
        <button
          onClick={() => setModals({ ...modals, management: {} })}
          className="ml-auto sm:ml-0 form-button form-button-secondary"
          title={t('toolbar.manage')}
        >
          <Settings2 size={15} />
        </button>

        {/* Desconectar (oculto no telemóvel — acessível via Gestão) */}
        <button
          onClick={() => disconnectMutation.mutate()}
          className="hidden sm:inline-flex form-button form-button-secondary inline-flex items-center gap-2 !text-red-600"
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

      {/* ── Barra de navegação: pastas e etiquetas ─────────── */}
      <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 border-b border-gray-200 dark:border-[#38383a] overflow-x-auto scrollbar-none snap-x snap-mandatory">
        {/* Pastas */}
        {folders.map((folder: MailFolder) => {
          const Icon = FOLDER_ICONS[folder.type] || FolderIcon;
          const active = folderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={() => selectFolder('folder', folder.id)}
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors snap-start flex-shrink-0
                ${active
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'}
              `}
            >
              <Icon size={13} />
              {t(`folders.types.${folder.type}`, folder.name)}
              {folder.unreadCount > 0 && (
                <span className="text-[10px] font-semibold bg-blue-600 text-white rounded-full px-1.5 py-px min-w-[16px] text-center leading-none">
                  {folder.unreadCount}
                </span>
              )}
            </button>
          );
        })}

        {/* Etiquetas (se existirem) */}
        {labels.length > 0 && <span className="w-px h-4 bg-gray-200 dark:bg-[#38383a] flex-shrink-0" />}
        {labels.map((label: MailLabel) => {
          const active = labelId === label.id;
          return (
            <button
              key={label.id}
              onClick={() => selectFolder('label', active ? null : label.id)}
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors snap-start flex-shrink-0
                ${active
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'}
              `}
            >
              <Tag size={12} style={{ color: label.color || '#6b7280' }} />
              {label.name}
            </button>
          );
        })}

        {/* Nova pasta (inline) */}
        {isAddingFolder ? (
          <div className="inline-flex items-center gap-1">
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  createFolderMutation.mutate(newFolderName.trim());
                }
                if (e.key === 'Escape') { setIsAddingFolder(false); setNewFolderName(''); }
              }}
              placeholder={t('folders.name_placeholder')}
              className="w-28 text-xs px-2 py-1 rounded border border-gray-300 dark:border-[#38383a] bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-[#f5f5f7]"
            />
            <button
              onClick={() => newFolderName.trim() && createFolderMutation.mutate(newFolderName.trim())}
              className="p-0.5 text-blue-600 hover:text-blue-700"
              title={t('common:buttons.save')}
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setIsAddingFolder(true); setNewFolderName(''); }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-400 dark:text-[#636366] hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] transition-colors"
            title={t('folders.new')}
          >
            <Plus size={13} />
          </button>
        )}

        {/* Última atualização (extremamente discreto) */}
        {foldersUpdatedAt > 0 && (
          <span className="ml-auto flex-shrink-0 text-[9px] text-gray-300 dark:text-[#48484a] whitespace-nowrap hidden sm:inline" title={t('toolbar.last_sync')}>
            {new Date(foldersUpdatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* ── Corpo: lista OU leitura em tela cheia ───────────── */}
      <div className="flex flex-1 min-h-0">
        {selectedMessage ? (
          <MessageView
            message={selectedMessage}
            onBack={() => setSelectedMessage(null)}
            onCompose={(mode, original) => openCompose(mode, original)}
            onChanged={() => { setSelectedMessage(null); invalidateAll(); }}
          />
        ) : (
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Filtro rápido da caixa de entrada: Não lidas / Todas */}
            {folderId && folders.find((f) => f.id === folderId)?.type === 'INBOX' && (
              <div className="flex items-center gap-1.5 px-3 py-1 text-[11px]">
                <button
                  onClick={() => selectInboxView('unread')}
                  className={`transition-colors ${
                    inboxView === 'unread'
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-400 dark:text-[#636366] hover:text-gray-600 dark:hover:text-[#a1a1a6]'
                  }`}
                >
                  {t('inbox.unread')}
                </button>
                <span className="text-gray-300 dark:text-[#38383a]">·</span>
                <button
                  onClick={() => selectInboxView('all')}
                  className={`transition-colors ${
                    inboxView === 'all'
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-400 dark:text-[#636366] hover:text-gray-600 dark:hover:text-[#a1a1a6]'
                  }`}
                >
                  {t('inbox.all')}
                </button>
              </div>
            )}
            <MessageList
              filters={effectiveFilters}
              onFiltersChange={(next) => setFilters({ ...next, folderId: undefined, labelId: undefined })}
              selectedMessageId={null}
              onSelectMessage={setSelectedMessage}
              onToggleFlag={handleToggleFlag}
              showSearch={showSearch}
            />
          </div>
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
