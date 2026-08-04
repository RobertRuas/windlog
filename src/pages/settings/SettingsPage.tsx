/**
 * ============================================================================
 * SETTINGS PAGE - Página de Configurações
 * ============================================================================
 *
 * O QUE É ESTA PÁGINA?
 * --------------------
 * Página simples de configurações do sistema.
 * Inclui atalhos para funcionalidades administrativas como consulta de logs.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Atalho para consulta de logs do sistema
 * - Layout limpo e organizado por secções
 *
 * SEGURANÇA:
 * ----------
 * - Requer autenticação (rota protegida)
 * - Secção de logs visível apenas para ADMIN
 * ============================================================================
 */

import { useTranslation } from 'react-i18next';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Componentes
import { PageHelp } from '@/components/ui/PageHelp';
import { AccountSection } from './components/AccountSection';
import { AdminSection } from './components/AdminSection';
import { MyFeedbacksSection } from './components/MyFeedbacksSection';
import { PreferencesSection } from './components/PreferencesSection';

/**
 * Verifica se o usuário atual tem role ADMIN.
 */
function isAdmin(): boolean {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'ADMIN';
  } catch {
    return false;
  }
}

/**
 * Componente SettingsPage - Página de configurações.
 */
export function SettingsPage() {
  const { t } = useTranslation('settings');
  const admin = isAdmin();

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Ajuda contextual da página */}
      <PageHelp title={t('help.title')} className="mb-4">
        <PageHelp.Section title={t('help.overview_title')}>
          <p>{t('help.overview_text')}</p>
        </PageHelp.Section>

        <PageHelp.Section title={t('help.sections_title')}>
          <PageHelp.Step>{t('help.step_preferences')}</PageHelp.Step>
          <PageHelp.Step>{t('help.step_account')}</PageHelp.Step>
          <PageHelp.Step>{t('help.step_feedbacks')}</PageHelp.Step>
          <PageHelp.Step>{t('help.step_admin')}</PageHelp.Step>
        </PageHelp.Section>

        <PageHelp.Section title={t('help.tip_title')}>
          <p>{t('help.tip_text')}</p>
        </PageHelp.Section>
      </PageHelp>

      {/* Secções */}
      <div className="space-y-4">
        {/* Preferências (idioma, tema, escala) */}
        <PreferencesSection t={t} />

        {/* Conta */}
        <AccountSection t={t} />

        {/* Secção: Meus Feedbacks (discreta — só aparece se o usuário quiser) */}
        <MyFeedbacksSection t={t} />

        {/* Secção: Administração */}
        {admin && <AdminSection t={t} />}

        {/* Mensagem para não-admin */}
        {!admin && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">
              {t('admin.noAccess')}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
