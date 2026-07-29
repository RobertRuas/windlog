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
import { AccountSection } from './components/AccountSection';
import { AdminSection } from './components/AdminSection';

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

      {/* Secções */}
      <div className="space-y-4">
        <AccountSection t={t} />

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
