/**
 * ============================================================================
 * ACCOUNT SECTION - Seção de Conta nas Configurações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a seção de conta nas configurações.
 * Inclui atalho para o perfil do usuário.
 *
 * PROPS:
 * ------
 * - t: função de tradução
 * ============================================================================
 */

import { useNavigate } from 'react-router-dom';
import { User, ChevronRight } from 'lucide-react';

/**
 * Props do componente AccountSection.
 */
interface AccountSectionProps {
  t: (key: string) => string;
}

/**
 * Componente AccountSection - Seção de conta nas configurações.
 */
export function AccountSection({ t }: AccountSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <User size={18} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">{t('sections.account')}</h2>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Meu Perfil */}
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <User size={18} className="text-blue-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">{t('account.myProfile.title')}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {t('account.myProfile.description')}
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}
