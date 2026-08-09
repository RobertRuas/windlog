/**
 * ============================================================================
 * CONNECT ACCOUNT CARD - Conexão da Conta de E-mail
 * ============================================================================
 *
 * O QUE É ESTE COMPONENTE?
 * ------------------------
 * Formulário exibido quando o usuário ainda não conectou a conta de e-mail.
 * O usuário informa APENAS e-mail e senha. As configurações de servidor
 * (imap.one.com / send.one.com) são pré-definidas e exibidas em modo
 * somente leitura.
 * ============================================================================
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Mail, Server, Lock } from 'lucide-react';

// Componentes de UI
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Serviço
import { connectMailAccount, getMailConfig } from '@/services/mail.service';

/**
 * Props do componente ConnectAccountCard.
 */
interface ConnectAccountCardProps {
  /** Callback chamado após conexão bem-sucedida */
  onConnected: () => void;
}

/**
 * Componente ConnectAccountCard - formulário de conexão (e-mail + senha).
 */
export function ConnectAccountCard({ onConnected }: ConnectAccountCardProps) {
  const { t } = useTranslation('mail');

  // Estado do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /**
   * Busca as configurações fixas dos servidores (somente leitura).
   */
  const { data: config } = useQuery({
    queryKey: ['mail-config'],
    queryFn: getMailConfig,
  });

  /**
   * Mutation de conexão — valida credenciais no servidor antes de salvar.
   */
  const connectMutation = useMutation({
    mutationFn: connectMailAccount,
    onSuccess: () => {
      toast.success(t('connect.success'));
      onConnected();
    },
    onError: (error: Error) => {
      toast.error(error.message || t('connect.error'));
    },
  });

  /**
   * Submete o formulário de conexão.
   */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    connectMutation.mutate({ email, password });
  }

  return (
    <div className="max-w-lg mx-auto mt-8">
      <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#38383a] p-8">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Mail size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#f5f5f7]">
              {t('connect.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-[#a1a1a6]">
              {t('connect.description')}
            </p>
          </div>
        </div>

        {/* Servidores pré-definidos (somente leitura) */}
        <div className="mt-6 mb-6 p-4 bg-gray-50 dark:bg-[#2c2c2e] rounded-lg border border-gray-200 dark:border-[#38383a]">
          <div className="flex items-center gap-2 mb-3">
            <Server size={14} className="text-gray-400 dark:text-[#636366]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#a1a1a6]">
              {t('connect.servers')}
            </span>
          </div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-[#a1a1a6]">{t('connect.incoming')}</dt>
              <dd className="font-mono text-gray-900 dark:text-[#f5f5f7]">
                {config ? `${config.imap.host}:${config.imap.port} (TLS)` : 'imap.one.com:993 (TLS)'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-[#a1a1a6]">{t('connect.outgoing')}</dt>
              <dd className="font-mono text-gray-900 dark:text-[#f5f5f7]">
                {config ? `${config.smtp.host}:${config.smtp.port} (TLS)` : 'send.one.com:465 (TLS)'}
              </dd>
            </div>
          </dl>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#636366]">
            <Lock size={12} />
            {t('connect.readonly_hint')}
          </p>
        </div>

        {/* Formulário: apenas e-mail + senha */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('connect.email_label')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@empresa.com"
            autoComplete="email"
            required
          />
          <Input
            label={t('connect.password_label')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Button type="submit" fullWidth loading={connectMutation.isPending}>
            {t('connect.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
