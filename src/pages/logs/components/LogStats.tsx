/**
 * ============================================================================
 * LOG STATS - Cards de Estatísticas dos Logs
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe os cards de estatísticas dos logs.
 * Mostra total de logs, erros, avisos e críticos.
 *
 * PROPS:
 * ------
 * - stats: estatísticas dos logs
 * - t: função de tradução
 * ============================================================================
 */

import { Activity, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';

/**
 * Props do componente LogStats.
 */
interface LogStatsProps {
  stats: {
    total: number;
    bySeverity: { severity: string; count: number }[];
  };
  t: (key: string) => string;
}

/**
 * Componente LogStats - Cards de estatísticas dos logs.
 */
export function LogStats({ stats, t }: LogStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Activity size={20} className="text-gray-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{t('stats.total')}</p>
          <p className="text-sm font-semibold text-gray-900">{stats.total.toLocaleString('pt-PT')}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
          <XCircle size={20} className="text-red-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{t('stats.errors')}</p>
          <p className="text-sm font-semibold text-gray-900">
            {stats.bySeverity.find((s) => s.severity === 'ERROR')?.count || 0}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-amber-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{t('stats.warnings')}</p>
          <p className="text-sm font-semibold text-gray-900">
            {stats.bySeverity.find((s) => s.severity === 'WARNING')?.count || 0}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
          <AlertCircle size={20} className="text-purple-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{t('stats.critical')}</p>
          <p className="text-sm font-semibold text-gray-900">
            {stats.bySeverity.find((s) => s.severity === 'CRITICAL')?.count || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
