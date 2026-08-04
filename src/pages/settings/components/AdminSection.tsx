/**
 * ============================================================================
 * ADMIN SECTION - Seção de Administração nas Configurações
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a seção de administração nas configurações.
 * Inclui atalho para logs do sistema (apenas para ADMIN).
 *
 * PROPS:
 * ------
 * - t: função de tradução
 * ============================================================================
 */

import { useNavigate } from 'react-router-dom';
import { FileText, Shield, ChevronRight } from 'lucide-react';

/**
 * Props do componente AdminSection.
 */
interface AdminSectionProps {
  t: (key: string) => string;
}

/**
 * Componente AdminSection - Seção de administração nas configurações.
 */
export function AdminSection({ t }: AdminSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-[#38383a] overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-[#38383a]">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-gray-500 dark:text-[#a1a1a6]" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-[#f5f5f7]">{t('sections.administration')}</h2>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-[#38383a]">
        {/* Logs do Sistema */}
        <button
          onClick={() => navigate('/logs')}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <FileText size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-[#f5f5f7]">{t('admin.systemLogs.title')}</div>
              <div className="text-xs text-gray-500 dark:text-[#a1a1a6] mt-0.5">
                {t('admin.systemLogs.description')}
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 dark:text-[#636366]" />
        </button>
      </div>
    </div>
  );
}
