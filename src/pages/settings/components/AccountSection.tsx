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
    <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#38383a] overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-[#38383a]">
        <div className="flex items-center gap-2">
          <User size={18} className="text-gray-500 dark:text-[#a1a1a6]" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-[#f5f5f7]">{t('sections.account')}</h2>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-[#38383a]">
        {/* Meu Perfil */}
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <User size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-[#f5f5f7]">{t('account.myProfile.title')}</div>
              <div className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-0.5">
                {t('account.myProfile.description')}
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 dark:text-[#636366]" />
        </button>
      </div>
    </div>
  );
}
