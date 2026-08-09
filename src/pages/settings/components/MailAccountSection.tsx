/**
 * ============================================================================
 * MAIL ACCOUNT SECTION - Seção de E-mail nas Configurações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Seção das configurações para a conta de e-mail integrada.
 * As informações de servidor são pré-definidas e exibidas em modo
 * SOMENTE LEITURA. O usuário informa apenas e-mail e senha e salva.
 *
 * COMPORTAMENTO:
 * --------------
 * - Sem conta conectada → formulário de conexão (e-mail + senha)
 * - Com conta conectada → cartão de estado + trocar senha + desconectar
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Mail, Lock, ChevronRight, ChevronDown, CircleCheck, CircleAlert, KeyRound,
} from 'lucide-react';

// Serviço
import {
  getMailAccount, getMailConfig, connectMailAccount, updateMailAccount,
  disconnectMailAccount,
} from '@/services/mail.service';
import { getProfile } from '@/services/auth.service';

/**
 * Componente MailAccountSection - configuração da conta de e-mail.
 */
export function MailAccountSection() {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estado do formulário (e-mail + senha apenas)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Conta conectada + configurações fixas dos servidores.
   */
  const { data: account } = useQuery({ queryKey: ['mail-account'], queryFn: getMailAccount });
  const { data: config } = useQuery({ queryKey: ['mail-config'], queryFn: getMailConfig });

  /**
   * Perfil do usuário atual (para pré-preencher o e-mail da conta).
   */
  const { data: profile } = useQuery({ queryKey: ['profile', 'current'], queryFn: getProfile });

  /**
   * Pré-preenche o campo de e-mail com o e-mail do usuário no sistema.
   * O campo continua editável — o usuário informa apenas a senha.
   */
  useEffect(() => {
    if (profile?.email && !email && !account) setEmail(profile.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.email, account]);

  /**
   * Invalida o cache da conta após mutações.
   */
  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['mail-account'] });
  }

  /**
   * Conecta a conta (primeira vez).
   */
  const connectMutation = useMutation({
    mutationFn: () => connectMailAccount({ email, password }),
    onSuccess: () => {
      invalidate();
      setEmail(''); setPassword('');
      toast.success(t('mail.connected'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Atualiza a senha da conta conectada.
   */
  const updateMutation = useMutation({
    mutationFn: () => updateMailAccount({ password }),
    onSuccess: () => {
      invalidate();
      setPassword('');
      toast.success(t('mail.updated'));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * Desconecta a conta.
   */
  const disconnectMutation = useMutation({
    mutationFn: disconnectMailAccount,
    onSuccess: () => {
      invalidate();
      toast.success(t('mail.disconnected'));
    },
  });

  /**
   * Conecta a conta (formulário inicial).
   */
  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (email && password) connectMutation.mutate();
  }

  /**
   * Atualiza a senha (conta já conectada).
   */
  function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password) updateMutation.mutate();
  }

  const busy = connectMutation.isPending || updateMutation.isPending;

  /**
   * Linha de servidor pré-definido (somente leitura).
   */
  function serverLine(label: string, host: string, port: number) {
    return (
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-gray-400 dark:text-[#636366]">{label}</span>
        <span className="font-mono text-gray-600 dark:text-[#a1a1a6]">{host}:{port}</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#38383a] overflow-hidden">
      {/* Cabeçalho clicável (acordeão) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-gray-500 dark:text-[#a1a1a6]" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-[#f5f5f7]">{t('sections.mail')}</h2>
          {/* Indicador rápido de estado no cabeçalho */}
          {account && <CircleCheck size={15} className="text-green-500" />}
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 dark:text-[#636366] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
      <div className="px-5 py-4 space-y-4 border-t border-gray-100 dark:border-[#38383a]">
        {/* ── Servidores pré-definidos (somente leitura) ───── */}
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-[#2c2c2e] text-gray-400 dark:text-[#636366]"
          title={t('mail.readonly_hint')}
        >
          <Lock size={13} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            {serverLine('IMAP', config?.imap.host || 'imap.one.com', config?.imap.port || 993)}
            {serverLine('SMTP', config?.smtp.host || 'send.one.com', config?.smtp.port || 465)}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-[#636366] mt-0.5">TLS</span>
        </div>

        {account ? (
          <>
            {/* ── Cartão de estado da conta conectada ──────── */}
            <div className="rounded-lg border border-gray-200 dark:border-[#38383a] divide-y divide-gray-100 dark:divide-[#38383a]">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <CircleCheck size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-[#f5f5f7] truncate">{account.email}</p>
                  <p className="text-xs text-gray-400 dark:text-[#636366]">
                    {t('mail.status_connected')} · {account.protocol} ·{' '}
                    {account.lastSyncAt
                      ? `${t('mail.last_sync')}: ${new Date(account.lastSyncAt).toLocaleString()}`
                      : t('mail.never_synced')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/mail')}
                  className="flex-shrink-0 form-button form-button-secondary inline-flex items-center gap-1 text-xs"
                >
                  {t('mail.open_mailbox')}
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Erro da última sincronização */}
              {account.lastSyncError && (
                <div className="flex items-start gap-2 px-4 py-2.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10">
                  <CircleAlert size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{t('mail.sync_error')}: {account.lastSyncError}</span>
                </div>
              )}
            </div>

            {/* ── Trocar senha ─────────────────────────────── */}
            <form onSubmit={handleUpdatePassword} className="rounded-lg border border-gray-200 dark:border-[#38383a] px-4 py-3 space-y-2.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#636366]">
                <KeyRound size={12} /> {t('mail.change_password_title')}
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('mail.password_placeholder')}
                  autoComplete="current-password"
                  className="form-input flex-1"
                />
                <button
                  type="submit"
                  disabled={busy || !password}
                  className="form-button form-button-primary disabled:opacity-50"
                >
                  {updateMutation.isPending ? t('common:status.loading') : t('mail.update')}
                </button>
              </div>
            </form>

            {/* ── Zona de perigo: desconectar ──────────────── */}
            <div className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-900/40 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-[#a1a1a6]">{t('mail.disconnect_hint')}</p>
              <button
                type="button"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="form-button form-button-secondary !text-red-600 disabled:opacity-50"
              >
                {t('mail.disconnect')}
              </button>
            </div>
          </>
        ) : (
          /* ── Formulário de conexão (sem conta) ───────────── */
          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#e5e5ea] mb-1">
                {t('mail.email_label')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="form-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#e5e5ea] mb-1">
                {t('mail.password_label')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="form-input w-full"
                required
              />
            </div>
            <button
              type="submit"
              disabled={busy || !email || !password}
              className="form-button form-button-primary disabled:opacity-50"
            >
              {connectMutation.isPending ? t('common:status.loading') : t('mail.save')}
            </button>
          </form>
        )}
      </div>
      )}
    </div>
  );
}
