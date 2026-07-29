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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">{t('sections.administration')}</h2>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Logs do Sistema */}
        <button
          onClick={() => navigate('/logs')}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">{t('admin.systemLogs.title')}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {t('admin.systemLogs.description')}
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}
