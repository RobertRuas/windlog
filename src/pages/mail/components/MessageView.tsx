/**
 * ============================================================================
 * MESSAGE VIEW - Painel de Leitura de Mensagem
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Coluna direita da caixa de correio: exibe a mensagem completa (corpo
 * HTML/texto), anexos, etiquetas e ações (responder, responder a todos,
 * encaminhar, sinalizar, importante, mover, arquivar, spam, remover,
 * etiquetar, bloquear remetente). Suporta agrupamento por conversa.
 *
 * SEGURANÇA:
 * ----------
 * O HTML é renderizado num iframe sandbox sem scripts.
 * Anexos suspeitos são sinalizados e o download é bloqueado.
 * ============================================================================
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Reply, ReplyAll, Forward, Star, AlertCircle, Trash2, Archive,
  AlertOctagon, FolderInput, Tag, Ban, Download, AlertTriangle,
  MessageSquareText, ArrowLeft,
} from 'lucide-react';

// Serviço
import {
  getMailMessage, getMailConversation, getMailLabels, getMailFolders,
  updateMessageFlags, moveMailMessage, deleteMailMessage, blockSender,
  applyMessageLabel, removeMessageLabel, downloadMailAttachment,
  type MailMessageDetail, type MailMessageSummary, type MailFolder,
} from '@/services/mail.service';

/**
 * Formata endereços para exibição.
 */
function formatAddresses(addresses?: { name?: string; address: string }[]): string {
  if (!addresses?.length) return '—';
  return addresses.map((a) => a.name || a.address).join(', ');
}

/**
 * Formata tamanho em bytes para exibição legível.
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Props do componente MessageView.
 */
interface MessageViewProps {
  /** Mensagem selecionada (resumo da lista) */
  message: MailMessageSummary;
  /** Callback para voltar à lista de mensagens */
  onBack: () => void;
  /** Callback de resposta/encaminhamento (abre o compose) */
  onCompose: (mode: 'reply' | 'reply-all' | 'forward', original: MailMessageDetail) => void;
  /** Callback após remover/mover (limpa seleção e atualiza lista) */
  onChanged: () => void;
}

/**
 * Componente MessageView - leitura da mensagem com todas as ações.
 */
export function MessageView({ message, onBack, onCompose, onChanged }: MessageViewProps) {
  const { t } = useTranslation('mail');
  const queryClient = useQueryClient();

  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showLabelMenu, setShowLabelMenu] = useState(false);

  /**
   * Busca a mensagem completa + conversa + etiquetas + pastas.
   */
  const { data: detail } = useQuery({
    queryKey: ['mail-message', message.id],
    queryFn: () => getMailMessage(message.id),
  });
  const { data: conversation } = useQuery({
    queryKey: ['mail-conversation', message.conversationId],
    queryFn: () => getMailConversation(message.conversationId!),
    enabled: Boolean(message.conversationId),
  });
  const { data: labels = [] } = useQuery({ queryKey: ['mail-labels'], queryFn: getMailLabels });
  const { data: folders = [] } = useQuery({ queryKey: ['mail-folders'], queryFn: getMailFolders });

  /**
   * Invalida listas após mutações.
   */
  function invalidateLists() {
    queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
    queryClient.invalidateQueries({ queryKey: ['mail-folders'] });
  }

  /**
   * Mutation de flags (lida/sinalizada/importante).
   */
  const flagsMutation = useMutation({
    mutationFn: (flags: { isFlagged?: boolean; isImportant?: boolean }) =>
      updateMessageFlags(message.id, flags),
    onSuccess: invalidateLists,
  });

  /**
   * Mutation de mover (arquivar, spam, pasta personalizada).
   */
  const moveMutation = useMutation({
    mutationFn: (folderId: string) => moveMailMessage(message.id, folderId),
    onSuccess: (_data, folderId) => {
      invalidateLists();
      setShowMoveMenu(false);
      const folder = folders.find((f: MailFolder) => f.id === folderId);
      toast.success(t('actions.moved', { folder: folder?.name || '' }));
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Mutation de remover (lixeira → definitiva).
   */
  const deleteMutation = useMutation({
    mutationFn: () => deleteMailMessage(message.id),
    onSuccess: () => {
      invalidateLists();
      toast.success(t('actions.deleted'));
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Mutation de bloquear remetente.
   */
  const blockMutation = useMutation({
    mutationFn: (email: string) => blockSender(email),
    onSuccess: () => toast.success(t('actions.sender_blocked')),
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Aplica/remove etiqueta da mensagem atual.
   */
  async function toggleLabel(labelId: string) {
    try {
      const has = detail?.labels?.some((l) => l.id === labelId);
      if (has) {
        await removeMessageLabel(message.id, labelId);
      } else {
        await applyMessageLabel(message.id, labelId);
      }
      queryClient.invalidateQueries({ queryKey: ['mail-message', message.id] });
      invalidateLists();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  /**
   * Download de anexo (bloqueado se suspeito).
   */
  async function handleDownload(attachmentId: string, filename: string, suspicious: boolean) {
    if (suspicious) {
      toast.error(t('view.suspicious_blocked'));
      return;
    }
    try {
      await downloadMailAttachment(attachmentId, filename);
    } catch {
      toast.error(t('view.download_error'));
    }
  }

  /**
   * Classe base dos botões de ação do cabeçalho.
   */
  const actionBtn = 'p-1.5 rounded-lg text-gray-500 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] hover:text-gray-800 dark:hover:text-[#f5f5f7] transition-colors';

  // Mensagens anteriores da conversa (exclui a atual)
  const thread = (conversation || []).filter((m) => m.id !== message.id);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
      {/* ── Barra de ações ─────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-b border-gray-200 dark:border-[#38383a] flex-wrap">
        {/* Voltar à lista */}
        <button
          className={`${actionBtn} inline-flex items-center gap-1.5 pr-2.5 font-medium text-sm mr-1`}
          onClick={onBack}
          title={`${t('view.back')} (Esc)`}
        >
          <ArrowLeft size={17} />
          {t('view.back')}
        </button>

        <span className="w-px h-5 bg-gray-200 dark:bg-[#38383a] mx-1" />

        <button className={actionBtn} onClick={() => detail && onCompose('reply', detail)} title={t('actions.reply')}>
          <Reply size={17} />
        </button>
        <button className={actionBtn} onClick={() => detail && onCompose('reply-all', detail)} title={t('actions.reply_all')}>
          <ReplyAll size={17} />
        </button>
        <button className={actionBtn} onClick={() => detail && onCompose('forward', detail)} title={t('actions.forward')}>
          <Forward size={17} />
        </button>

        <span className="w-px h-5 bg-gray-200 dark:bg-[#38383a] mx-1" />

        <button
          className={actionBtn}
          onClick={() => flagsMutation.mutate({ isFlagged: !message.isFlagged })}
          title={t('actions.flag')}
        >
          <Star size={17} className={message.isFlagged ? 'text-yellow-500 fill-yellow-500' : ''} />
        </button>
        <button
          className={actionBtn}
          onClick={() => flagsMutation.mutate({ isImportant: !message.isImportant })}
          title={t('actions.important')}
        >
          <AlertCircle size={17} className={message.isImportant ? 'text-red-500' : ''} />
        </button>

        <span className="w-px h-5 bg-gray-200 dark:bg-[#38383a] mx-1" />

        {/* Mover para pasta (arquivar, spam, personalizadas) */}
        <div className="relative">
          <button className={actionBtn} onClick={() => { setShowMoveMenu(!showMoveMenu); setShowLabelMenu(false); }} title={t('actions.move')}>
            <FolderInput size={17} />
          </button>
          {showMoveMenu && (
            <div className="absolute left-0 top-full mt-1 z-10 w-48 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
              {folders.filter((f: MailFolder) => f.id !== message.folderId).map((folder: MailFolder) => (
                <button
                  key={folder.id}
                  onClick={() => moveMutation.mutate(folder.id)}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]"
                >
                  {t(`folders.types.${folder.type}`, folder.name)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Etiquetas */}
        <div className="relative">
          <button className={actionBtn} onClick={() => { setShowLabelMenu(!showLabelMenu); setShowMoveMenu(false); }} title={t('labels.title')}>
            <Tag size={17} />
          </button>
          {showLabelMenu && (
            <div className="absolute left-0 top-full mt-1 z-10 w-48 bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
              {labels.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">{t('labels.empty')}</p>
              ) : labels.map((label) => {
                const has = detail?.labels?.some((l) => l.id === label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-sm text-gray-700 dark:text-[#a1a1a6] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color || '#6b7280' }} />
                    <span className="flex-1 truncate">{label.name}</span>
                    {has && <span className="text-blue-600">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ações rápidas: arquivar, spam, remover */}
        <button
          className={actionBtn}
          onClick={() => {
            const archive = folders.find((f: MailFolder) => f.type === 'ARCHIVE');
            if (archive) moveMutation.mutate(archive.id);
          }}
          title={t('actions.archive')}
        >
          <Archive size={17} />
        </button>
        <button
          className={actionBtn}
          onClick={() => {
            const spam = folders.find((f: MailFolder) => f.type === 'SPAM');
            if (spam) moveMutation.mutate(spam.id);
          }}
          title={t('actions.mark_spam')}
        >
          <AlertOctagon size={17} />
        </button>
        <button className={`${actionBtn} hover:!text-red-600`} onClick={() => deleteMutation.mutate()} title={t('actions.delete')}>
          <Trash2 size={17} />
        </button>

        {/* Bloquear remetente */}
        {detail?.from?.[0]?.address && (
          <button
            className={`${actionBtn} hover:!text-red-600 ml-auto`}
            onClick={() => blockMutation.mutate(detail.from[0].address)}
            title={t('actions.block_sender')}
          >
            <Ban size={17} />
          </button>
        )}
      </div>

      {/* ── Conteúdo da mensagem ───────────────────────────── */}
      {detail && (
        <div className="flex-1 px-6 py-5">
          {/* Assunto + etiquetas */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5f7]">
              {detail.subject || t('list.no_subject')}
            </h2>
            {detail.labels?.map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${label.color || '#6b7280'}22`, color: label.color || '#6b7280' }}
              >
                <Tag size={10} />
                {label.name}
              </span>
            ))}
          </div>

          {/* Cabeçalho: remetente/destinatários/data */}
          <div className="mt-3 pb-4 border-b border-gray-100 dark:border-[#2c2c2e] text-sm">
            <div className="flex justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-[#f5f5f7]">
                  {formatAddresses(detail.from)}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#a1a1a6] truncate">{detail.from?.[0]?.address}</p>
              </div>
              <span className="flex-shrink-0 text-xs text-gray-400">
                {new Date(detail.date).toLocaleString()}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-[#a1a1a6]">
              {t('view.to')}: {formatAddresses(detail.to)}
            </p>
            {detail.cc?.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-[#a1a1a6]">
                {t('view.cc')}: {formatAddresses(detail.cc)}
              </p>
            )}
          </div>

          {/* Aviso de anexo suspeito */}
          {detail.hasSuspiciousAttachment && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg text-sm text-red-700 dark:text-red-400">
              <AlertTriangle size={16} />
              {t('view.suspicious_warning')}
            </div>
          )}

          {/* Corpo: HTML (iframe sandbox) ou texto simples */}
          <div className="mt-4">
            {detail.htmlBody ? (
              <iframe
                title="mail-body"
                sandbox=""
                srcDoc={detail.htmlBody}
                className="w-full min-h-[300px] border-0 bg-white rounded"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-[#e5e5ea] font-sans">
                {detail.textBody || ''}
              </pre>
            )}
          </div>

          {/* Anexos */}
          {detail.attachments?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#636366] mb-2">
                {t('view.attachments')} ({detail.attachments.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {detail.attachments.map((att) => (
                  <button
                    key={att.id}
                    onClick={() => handleDownload(att.id, att.filename, att.isSuspicious)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors
                      ${att.isSuspicious
                        ? 'border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 cursor-not-allowed'
                        : 'border-gray-200 dark:border-[#38383a] text-gray-700 dark:text-[#a1a1a6] hover:bg-gray-50 dark:hover:bg-[#2c2c2e]'}
                    `}
                  >
                    {att.isSuspicious ? <AlertTriangle size={15} /> : <PaperclipIcon />}
                    <span className="max-w-[180px] truncate">{att.filename}</span>
                    <span className="text-xs text-gray-400">{formatSize(att.size)}</span>
                    {!att.isSuspicious && <Download size={13} className="text-gray-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversa agrupada (mensagens anteriores) */}
          {thread.length > 0 && (
            <div className="mt-8">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#636366] mb-3">
                <MessageSquareText size={13} />
                {t('view.conversation')} ({thread.length})
              </h3>
              <div className="space-y-2">
                {thread.map((m) => (
                  <div key={m.id} className="p-3 bg-gray-50 dark:bg-[#1f1f21] rounded-lg border border-gray-100 dark:border-[#2c2c2e]">
                    <div className="flex justify-between gap-3 text-xs text-gray-500 dark:text-[#a1a1a6]">
                      <span className="font-medium text-gray-700 dark:text-[#e5e5ea] truncate">
                        {formatAddresses(m.from)}
                      </span>
                      <span className="flex-shrink-0">{new Date(m.date).toLocaleString()}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-600 dark:text-[#a1a1a6] whitespace-pre-wrap line-clamp-4">
                      {m.textBody || ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ícone de clipe (inline para evitar conflito de props).
 */
function PaperclipIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
