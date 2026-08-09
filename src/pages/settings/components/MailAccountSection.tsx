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
 * - Com conta conectada → estado atual + trocar senha + desconectar
 * ============================================================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Mail, Lock, ChevronRight, ChevronDown } from 'lucide-react';

// Serviço
import {
  getMailAccount, getMailConfig, connectMailAccount, updateMailAccount,
  disconnectMailAccount,
} from '@/services/mail.service';

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
   * Salva conforme o estado (conectar ou atualizar senha).
   */
  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (account) {
      if (password) updateMutation.mutate();
    } else {
      if (email && password) connectMutation.mutate();
    }
  }

  const busy = connectMutation.isPending || updateMutation.isPending;

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
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 dark:text-[#636366] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
      <div className="px-5 py-4 space-y-4 border-t border-gray-100 dark:border-[#38383a]">
        {/* ── Servidores pré-definidos (somente leitura, minimalista) ── */}
        <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#636366]">
          <Lock size={11} className="flex-shrink-0" />
          <span className="font-mono truncate" title={t('mail.readonly_hint')}>
            IMAP {config ? `${config.imap.host}:${config.imap.port}` : 'imap.one.com:993'}
            {' · '}
            SMTP {config ? `${config.smtp.host}:${config.smtp.port}` : 'send.one.com:465'}
            {' (TLS)'}
          </span>
        </p>

        {/* ── Formulário: e-mail + senha ───────────────────── */}
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#e5e5ea] mb-1">
              {t('mail.email_label')}
            </label>
            <input
              type="email"
              value={account ? account.email : email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={Boolean(account)}
              placeholder="nome@empresa.com"
              className="form-input w-full disabled:opacity-60 disabled:cursor-not-allowed"
              required={!account}
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
              placeholder={account ? t('mail.password_placeholder') : ''}
              autoComplete="current-password"
              className="form-input w-full"
              required={!account}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={busy || (account ? !password : !email || !password)}
              className="form-button form-button-primary disabled:opacity-50"
            >
              {busy ? t('common:status.loading') : account ? t('mail.update') : t('mail.save')}
            </button>

            {account && (
              <button
                type="button"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="form-button form-button-secondary !text-red-600 disabled:opacity-50"
              >
                {t('mail.disconnect')}
              </button>
            )}

            {account && (
              <button
                type="button"
                onClick={() => navigate('/mail')}
                className="ml-auto inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                {t('mail.open_mailbox')}
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {/* Estado da conta conectada */}
          {account && (
            <p className="text-xs text-gray-400 dark:text-[#636366]">
              {t('mail.status_connected')} · {account.protocol}
              {account.lastSyncAt && <> · {t('mail.last_sync')}: {new Date(account.lastSyncAt).toLocaleString()}</>}
            </p>
          )}
        </form>
      </div>
      )}
    </div>
  );
}
