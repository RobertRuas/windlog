/**
 * ============================================================================
 * MAIL PAGE - Cliente de E-mail Integrado
 * ============================================================================
 *
 * O QUE É ESTA PÁGINA?
 * --------------------
 * Página principal do módulo de e-mail. Se o usuário ainda não conectou
 * a conta, exibe o formulário de conexão (apenas e-mail + senha, com os
 * servidores pré-definidos em modo somente leitura). Caso contrário,
 * exibe a caixa de correio completa (pastas, mensagens, leitura).
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';

// Serviço
import { getMailAccount } from '@/services/mail.service';

// Componentes do módulo
import { ConnectAccountCard } from './components/ConnectAccountCard';
import { MailInbox } from './components/MailInbox';

/**
 * Componente MailPage - página do cliente de e-mail.
 */
export function MailPage() {
  const { t } = useTranslation('mail');

  /**
   * Busca a conta conectada do usuário (null se ainda não conectou).
   */
  const { data: account, isLoading, refetch } = useQuery({
    queryKey: ['mail-account'],
    queryFn: getMailAccount,
  });

  return (
    <AppLayout>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {isLoading ? (
        /* Estado de carregamento */
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-500 dark:text-[#a1a1a6] animate-pulse">
            {t('common:status.loading')}
          </p>
        </div>
      ) : !account ? (
        /* Conta não conectada → formulário de conexão */
        <ConnectAccountCard onConnected={() => refetch()} />
      ) : (
        /* Conta conectada → caixa de correio completa */
        <MailInbox account={account} />
      )}
    </AppLayout>
  );
}
