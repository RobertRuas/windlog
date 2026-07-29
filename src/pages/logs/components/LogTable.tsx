/**
 * ============================================================================
 * LOG TABLE - Tabela de Logs com Paginação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a tabela de logs com paginação.
 * Inclui agrupamento de logs consecutivos e expansão de grupos.
 *
 * PROPS:
 * ------
 * - logsData: dados dos logs
 * - logsLoading: se está carregando
 * - logGroups: grupos de logs
 * - expandedRows: linhas expandidas
 * - expandedGroups: grupos expandidos
 * - onToggleRow: função para expandir/recolher linha
 * - onToggleGroup: função para expandir/recolher grupo
 * - onPageChange: função para mudar de página
 * - t: função de tradução
 * ============================================================================
 */

import { ChevronLeft, ChevronRight, RefreshCw, Terminal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LogRow, SEVERITY_CONFIG, METHOD_COLORS, getStatusColor, formatDuration, formatDateTime } from './LogRow';
import type { SystemLog } from '@/services/system-log.service';

/** Tipo para logs agrupados. */
export type LogGroup = {
  key: string;
  logs: SystemLog[];
  method: string | null;
  url: string | null;
  user: string;
};

/**
 * Props do componente LogTable.
 */
interface LogTableProps {
  logsData?: {
    data: SystemLog[];
    total: number;
    page: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  logsLoading: boolean;
  logGroups: LogGroup[];
  expandedRows: Set<string>;
  expandedGroups: Set<string>;
  onToggleRow: (logId: string) => void;
  onToggleGroup: (groupKey: string) => void;
  onPageChange: (page: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Componente LogTable - Tabela de logs com paginação.
 */
export function LogTable({
  logsData,
  logsLoading,
  logGroups,
  expandedRows,
  expandedGroups,
  onToggleRow,
  onToggleGroup,
  onPageChange,
  t,
}: LogTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header da tabela */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {logsLoading ? t('table.loading') : t('table.records', { count: logsData?.total ?? 0 })}
        </p>
      </div>

      {logsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-gray-400">
            <RefreshCw size={18} className="animate-spin" />
            <p className="text-sm">{t('table.loading')}</p>
          </div>
        </div>
      ) : !logsData || logsData.data.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Terminal size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t('table.empty')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('table.emptyHint')}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{t('table.date')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{t('table.level')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{t('table.request')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{t('table.status')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{t('table.duration')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{t('table.action')}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{t('table.user')}</th>
                  <th className="px-4 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {logGroups.map((group) => {
                  const isGroupExpanded = expandedGroups.has(group.key);
                  const isSingleLog = group.logs.length === 1;

                  if (isSingleLog) {
                    return (
                      <LogRow
                        key={group.logs[0].id}
                        log={group.logs[0]}
                        isExpanded={expandedRows.has(group.logs[0].id)}
                        onToggle={() => onToggleRow(group.logs[0].id)}
                        t={t}
                      />
                    );
                  }

                  const firstLog = group.logs[0];
                  const severityKey = firstLog.severity?.toLowerCase() || 'info';
                  const severity = SEVERITY_CONFIG[firstLog.severity] || SEVERITY_CONFIG.INFO;

                  return (
                    <>
                      {/* Linha do grupo (colapsável) */}
                      <tr
                        key={group.key}
                        onClick={() => onToggleGroup(group.key)}
                        className={`cursor-pointer transition-colors border-b border-gray-100 ${
                          isGroupExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
                          {formatDateTime(firstLog.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${severity.color} ${severity.bg}`}>
                            {t(`severity.${severityKey}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs max-w-[240px]">
                          <div className="flex items-center gap-2">
                            {firstLog.method && (
                              <span className={`font-mono font-semibold text-[11px] ${METHOD_COLORS[firstLog.method] || 'text-gray-500'}`}>
                                {firstLog.method}
                              </span>
                            )}
                            <span className="text-gray-500 truncate font-mono" title={firstLog.url || undefined}>
                              {firstLog.url || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono font-semibold">
                          <span className={getStatusColor(firstLog.statusCode)}>
                            {firstLog.statusCode || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                          {formatDuration(firstLog.duration)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {t(`actions.${firstLog.action}`) || firstLog.action}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[150px]">
                          {group.user}
                          <span className="ml-1 text-gray-400">({group.logs.length})</span>
                        </td>
                        <td className="px-4 py-3 w-8">
                          <ChevronDown
                            size={14}
                            className={`text-gray-400 transition-transform duration-200 ${isGroupExpanded ? 'rotate-180' : ''}`}
                          />
                        </td>
                      </tr>

                      {/* Logs expandidos do grupo */}
                      {isGroupExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={8} className="px-4 py-0">
                            <div className="ml-3 pl-4 border-l-2 border-gray-200 py-3">
                              <div className="space-y-2">
                                {group.logs.map((log) => (
                                  <LogRow
                                    key={log.id}
                                    log={log}
                                    isExpanded={expandedRows.has(log.id)}
                                    onToggle={() => onToggleRow(log.id)}
                                    t={t}
                                  />
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {(logsData.totalPages ?? 0) > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {t('table.page', { page: logsData.page, totalPages: logsData.totalPages })}
                <span className="text-gray-400 ml-2">({logsData.total.toLocaleString('pt-PT')} registros)</span>
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => onPageChange(logsData.page - 1)}
                  disabled={!logsData.hasPreviousPage}
                  variant="secondary"
                  size="sm"
                >
                  <ChevronLeft size={14} className="mr-1" />
                  {t('table.previous')}
                </Button>
                <Button
                  onClick={() => onPageChange(logsData.page + 1)}
                  disabled={!logsData.hasNextPage}
                  variant="secondary"
                  size="sm"
                >
                  {t('table.next')}
                  <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
