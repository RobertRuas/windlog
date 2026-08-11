/**
 * ============================================================================
 * LOG STATS - Cards de Estatísticas dos Logs
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe os cards de estatísticas dos logs.
 * Mostra total de logs, erros, avisos e críticos em caixas compactas
 * lado a lado (sempre 4 numa linha).
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
  const errorCount = stats.bySeverity.find((s) => s.severity === 'ERROR')?.count || 0;
  const warnCount = stats.bySeverity.find((s) => s.severity === 'WARNING')?.count || 0;
  const critCount = stats.bySeverity.find((s) => s.severity === 'CRITICAL')?.count || 0;

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {/* Total */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#38383a] px-3 py-2.5 flex items-center gap-2.5">
        <Activity size={14} className="text-gray-400 dark:text-[#636366] flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 dark:text-[#636366] font-medium uppercase tracking-wide leading-none mb-0.5">{t('stats.total')}</p>
          <p className="text-sm font-bold text-gray-900 dark:text-[#f5f5f7] tabular-nums leading-none">{stats.total.toLocaleString('pt-PT')}</p>
        </div>
      </div>

      {/* Erros */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#38383a] px-3 py-2.5 flex items-center gap-2.5">
        <XCircle size={14} className="text-red-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 dark:text-[#636366] font-medium uppercase tracking-wide leading-none mb-0.5">{t('stats.errors')}</p>
          <p className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums leading-none">{errorCount}</p>
        </div>
      </div>

      {/* Avisos */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#38383a] px-3 py-2.5 flex items-center gap-2.5">
        <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 dark:text-[#636366] font-medium uppercase tracking-wide leading-none mb-0.5">{t('stats.warnings')}</p>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums leading-none">{warnCount}</p>
        </div>
      </div>

      {/* Críticos */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-gray-200 dark:border-[#38383a] px-3 py-2.5 flex items-center gap-2.5">
        <AlertCircle size={14} className="text-purple-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 dark:text-[#636366] font-medium uppercase tracking-wide leading-none mb-0.5">{t('stats.critical')}</p>
          <p className="text-sm font-bold text-purple-600 dark:text-purple-400 tabular-nums leading-none">{critCount}</p>
        </div>
      </div>
    </div>
  );
}
