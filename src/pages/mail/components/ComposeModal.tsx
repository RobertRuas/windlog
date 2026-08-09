/**
 * ============================================================================
 * COMPOSE MODAL - Composição de E-mail
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Modal para escrever, responder ou encaminhar e-mails. Suporta:
 * - Destinatários Para/Cc/Bcc com sugestões de contatos e grupos
 * - Anexos (multipart), rascunhos, assinaturas personalizadas
 * - Resposta automática do assunto (Re:/Fwd:) e threading (In-Reply-To)
 * ============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { X, Paperclip, Send, Save, Users } from 'lucide-react';

// Serviço
import {
  sendMail, saveMailDraft, getMailContacts, getMailContactGroups, getMailSignatures,
  type MailAddress, type MailMessageDetail, type MailContact, type MailContactGroup,
} from '@/services/mail.service';

/**
 * Modo de composição.
 */
export type ComposeMode = 'new' | 'reply' | 'reply-all' | 'forward' | 'draft';

/**
 * Props do componente ComposeModal.
 */
interface ComposeModalProps {
  /** Modo de composição */
  mode: ComposeMode;
  /** Mensagem original (resposta/encaminhamento/rascunho) */
  original?: MailMessageDetail | null;
  /** Callback de fechamento */
  onClose: () => void;
  /** Callback após envio bem-sucedido */
  onSent: () => void;
}

/**
 * Componente ComposeModal - modal de composição de e-mail.
 */
export function ComposeModal({ mode, original, onClose, onSent }: ComposeModalProps) {
  const { t } = useTranslation('mail');

  /**
   * Estado inicial derivado do modo e da mensagem original.
   */
  const initialState = useMemo(() => {
    if (mode === 'reply' && original) {
      return {
        to: original.from,
        cc: [] as MailAddress[],
        bcc: [] as MailAddress[],
        subject: original.subject?.startsWith('Re:') ? original.subject : `Re: ${original.subject || ''}`,
        body: `\n\n--- ${new Date(original.date).toLocaleString()} ---\n${original.textBody || ''}`,
        inReplyTo: original.messageId || undefined,
        draftId: undefined as string | undefined,
      };
    }
    if (mode === 'reply-all' && original) {
      const others = [...(original.to || []), ...(original.cc || [])].filter(
        (a) => !original.from?.some((f) => f.address === a.address),
      );
      return {
        to: original.from,
        cc: others,
        bcc: [] as MailAddress[],
        subject: original.subject?.startsWith('Re:') ? original.subject : `Re: ${original.subject || ''}`,
        body: `\n\n--- ${new Date(original.date).toLocaleString()} ---\n${original.textBody || ''}`,
        inReplyTo: original.messageId || undefined,
        draftId: undefined as string | undefined,
      };
    }
    if (mode === 'forward' && original) {
      return {
        to: [] as MailAddress[],
        cc: [] as MailAddress[],
        bcc: [] as MailAddress[],
        subject: original.subject?.startsWith('Fwd:') ? original.subject : `Fwd: ${original.subject || ''}`,
        body: `\n\n--- ${new Date(original.date).toLocaleString()} ---\n${original.textBody || ''}`,
        inReplyTo: undefined as string | undefined,
        draftId: undefined as string | undefined,
      };
    }
    if (mode === 'draft' && original) {
      return {
        to: original.to || [],
        cc: original.cc || [],
        bcc: original.bcc || [],
        subject: original.subject || '',
        body: original.textBody || '',
        inReplyTo: undefined as string | undefined,
        draftId: original.id,
      };
    }
    return {
      to: [] as MailAddress[],
      cc: [] as MailAddress[],
      bcc: [] as MailAddress[],
      subject: '',
      body: '',
      inReplyTo: undefined as string | undefined,
      draftId: undefined as string | undefined,
    };
  }, [mode, original]);

  // Campos do formulário
  const [toInput, setToInput] = useState(initialState.to.map((a) => a.address).join(', '));
  const [ccInput, setCcInput] = useState(initialState.cc.map((a) => a.address).join(', '));
  const [bccInput, setBccInput] = useState(initialState.bcc.map((a) => a.address).join(', '));
  const [subject, setSubject] = useState(initialState.subject);
  const [body, setBody] = useState(initialState.body);
  const [files, setFiles] = useState<File[]>([]);
  const [showCc, setShowCc] = useState(initialState.cc.length > 0);
  const [showBcc, setShowBcc] = useState(initialState.bcc.length > 0);

  /**
   * Contatos, grupos e assinaturas para sugestões.
   */
  const { data: contacts = [] } = useQuery({ queryKey: ['mail-contacts'], queryFn: getMailContacts });
  const { data: groups = [] } = useQuery({ queryKey: ['mail-contact-groups'], queryFn: getMailContactGroups });
  const { data: signatures = [] } = useQuery({ queryKey: ['mail-signatures'], queryFn: getMailSignatures });

  /**
   * Aplica a assinatura padrão ao abrir (apenas nova mensagem).
   */
  useEffect(() => {
    if (mode === 'new') {
      const def = signatures.find((s) => s.isDefault) || signatures[0];
      if (def && !body) setBody(`\n\n${def.content}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatures.length]);

  /**
   * Converte string de endereços separados por vírgula em MailAddress[].
   */
  function parseAddresses(input: string): MailAddress[] {
    return input
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((address) => ({ address }));
  }

  /**
   * Mutation de envio.
   */
  const sendMutation = useMutation({
    mutationFn: sendMail,
    onSuccess: () => {
      toast.success(t('compose.sent'));
      onSent();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || t('compose.send_error')),
  });

  /**
   * Mutation de salvar rascunho.
   */
  const draftMutation = useMutation({
    mutationFn: (draftId?: string) =>
      saveMailDraft(
        {
          to: parseAddresses(toInput),
          cc: parseAddresses(ccInput),
          subject,
          body,
        },
        draftId,
      ),
    onSuccess: () => {
      toast.success(t('compose.draft_saved'));
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Envia o e-mail.
   */
  function handleSend() {
    const to = parseAddresses(toInput);
    if (!to.length) {
      toast.error(t('compose.no_recipients'));
      return;
    }
    sendMutation.mutate({
      to,
      cc: parseAddresses(ccInput),
      bcc: parseAddresses(bccInput),
      subject,
      body,
      draftId: initialState.draftId,
      inReplyTo: initialState.inReplyTo,
      files,
    });
  }

  /**
   * Adiciona um contato/grupo ao campo Para.
   */
  function addRecipient(address: string) {
    setToInput((prev) => (prev ? `${prev}, ${address}` : address));
  }

  /**
   * Adiciona todos os membros de um grupo ao campo Para.
   */
  function addGroup(group: MailContactGroup) {
    const addresses = group.members.map((m) => m.contact.email);
    setToInput((prev) => (prev ? `${prev}, ${addresses.join(', ')}` : addresses.join(', ')));
  }

  const inputClass = 'w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-[#38383a] bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#38383a] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* ── Cabeçalho ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-[#38383a]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-[#f5f5f7]">
            {t(`compose.titles.${mode}`, t('compose.titles.new'))}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]">
            <X size={18} />
          </button>
        </div>

        {/* ── Formulário ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Para + toggles Cc/Bcc */}
          <div>
            <div className="flex items-center gap-2">
              <label className="w-12 text-xs font-medium text-gray-500 dark:text-[#a1a1a6]">{t('compose.to')}</label>
              <input value={toInput} onChange={(e) => setToInput(e.target.value)} className={inputClass} />
              <button onClick={() => setShowCc(!showCc)} className="text-xs text-gray-400 hover:text-gray-600">Cc</button>
              <button onClick={() => setShowBcc(!showBcc)} className="text-xs text-gray-400 hover:text-gray-600">Bcc</button>
            </div>
          </div>
          {showCc && (
            <div className="flex items-center gap-2">
              <label className="w-12 text-xs font-medium text-gray-500 dark:text-[#a1a1a6]">Cc</label>
              <input value={ccInput} onChange={(e) => setCcInput(e.target.value)} className={inputClass} />
            </div>
          )}
          {showBcc && (
            <div className="flex items-center gap-2">
              <label className="w-12 text-xs font-medium text-gray-500 dark:text-[#a1a1a6]">Bcc</label>
              <input value={bccInput} onChange={(e) => setBccInput(e.target.value)} className={inputClass} />
            </div>
          )}

          {/* Sugestões de contatos e grupos */}
          {(contacts.length > 0 || groups.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 pl-14">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => addGroup(group)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                  title={t('compose.add_group')}
                >
                  <Users size={11} />
                  {group.name}
                </button>
              ))}
              {contacts.slice(0, 8).map((contact: MailContact) => (
                <button
                  key={contact.id}
                  onClick={() => addRecipient(contact.email)}
                  className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-[#2c2c2e] text-gray-600 dark:text-[#a1a1a6] hover:bg-gray-200 dark:hover:bg-[#38383a]"
                >
                  {contact.name || contact.email}
                </button>
              ))}
            </div>
          )}

          {/* Assunto */}
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('compose.subject_placeholder')}
            className={inputClass}
          />

          {/* Corpo */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder={t('compose.body_placeholder')}
            className={`${inputClass} resize-y font-sans`}
          />

          {/* Anexos */}
          <div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-[#a1a1a6] cursor-pointer hover:text-blue-600">
              <Paperclip size={15} />
              {t('compose.attach')}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles([...files, ...Array.from(e.target.files || [])])}
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((file, i) => (
                  <li key={`${file.name}-${i}`} className="flex items-center gap-2 text-xs text-gray-500 dark:text-[#a1a1a6]">
                    <Paperclip size={11} />
                    <span className="truncate">{file.name}</span>
                    <span className="text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
                    <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                      <X size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Rodapé: ações ─────────────────────────────────── */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-200 dark:border-[#38383a]">
          <button
            onClick={handleSend}
            disabled={sendMutation.isPending}
            className="form-button form-button-primary inline-flex items-center gap-2"
          >
            {sendMutation.isPending ? (
              <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
            ) : (
              <Send size={15} />
            )}
            {t('compose.send')}
          </button>
          <button
            onClick={() => draftMutation.mutate(initialState.draftId)}
            disabled={draftMutation.isPending}
            className="form-button form-button-secondary inline-flex items-center gap-2"
          >
            <Save size={15} />
            {t('compose.save_draft')}
          </button>
          <button onClick={onClose} className="ml-auto form-button form-button-secondary">
            {t('common:buttons.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
