/**
 * ============================================================================
 * LOGS PAGE - Página de Logs do Sistema
 * ============================================================================
 *
 * Página administrativa para visualização de logs do sistema.
 * Design minimalista alinhado ao design system do projeto.
 *
 * SEGURANÇA: Apenas administradores podem acessar.
 * ============================================================================
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';

// Componentes
import { LogStats } from './components/LogStats';
import { LogFilters } from './components/LogFilters';
import { LogTable, type LogGroup } from './components/LogTable';

// Serviços
import { getLogs, getLogStats, getCaptureStatus, setCaptureStatus, type LogFilters as LogFiltersType, type SystemLog } from '@/services/system-log.service';

/** Retorna a cor do status code. */
function getRequestUserKey(log: SystemLog): string {
  const user = log.userEmail || log.userName || 'anonymous';
  return `${log.method || ''}-${log.url || ''}-${user}`;
}

/** Agrupa logs consecutivos com mesmo Request + Usuário. */
function groupConsecutiveLogs(logs: SystemLog[]): LogGroup[] {
  if (logs.length === 0) return [];

  const groups: LogGroup[] = [];
  let currentGroup: LogGroup | null = null;

  for (const log of logs) {
    const key = getRequestUserKey(log);
    const user = log.userEmail || log.userName || '—';

    if (currentGroup && currentGroup.key === key) {
      currentGroup.logs.push(log);
    } else {
      currentGroup = {
        key,
        logs: [log],
        method: log.method,
        url: log.url,
        user,
      };
      groups.push(currentGroup);
    }
  }

  return groups;
}

/**
 * Componente LogsPage - Página de logs do sistema.
 */
export function LogsPage() {
  const { t } = useTranslation('logs');
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LogFiltersType>({ page: 1, limit: 50 });
  const [searchInput, setSearchInput] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['system-logs', filters],
    queryFn: () => getLogs(filters),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['system-logs-stats'],
    queryFn: getLogStats,
    refetchInterval: 60000,
  });

  const { data: captureStatus } = useQuery({
    queryKey: ['system-logs-capture'],
    queryFn: getCaptureStatus,
  });

  const captureMutation = useMutation({
    mutationFn: (enabled: boolean) => setCaptureStatus(enabled),
    onSuccess: (data) => {
      queryClient.setQueryData(['system-logs-capture'], data);
      toast.success(data.enabled ? t('capture.toastEnabled') : t('capture.toastDisabled'));
    },
    onError: () => {
      toast.error(t('capture.toastError'));
    },
  });

  function handleCaptureToggle() {
    if (captureStatus === undefined) return;
    captureMutation.mutate(!captureStatus.enabled);
  }

  function handleSearch() {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  }

  function handleClearFilters() {
    setFilters({ page: 1, limit: 50 });
    setSearchInput('');
  }

  function handlePageChange(newPage: number) {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }

  function toggleRow(logId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  }

  function toggleGroup(groupKey: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }

  /** Agrupa logs consecutivos com mesmo Request + Usuário. */
  const logGroups = useMemo(() => {
    if (!logsData?.data) return [];
    return groupConsecutiveLogs(logsData.data);
  }, [logsData]);

  return (
    <AppLayout>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
            <span className="text-sm font-medium text-gray-700">{t('capture.label')}</span>
            <button
              type="button"
              role="switch"
              aria-checked={captureStatus?.enabled ?? true}
              disabled={captureMutation.isPending}
              onClick={handleCaptureToggle}
              className={[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                'transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                (captureStatus?.enabled ?? true) ? 'bg-blue-600' : 'bg-gray-300',
                captureMutation.isPending ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
            >
              <span
                className={[
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out',
                  (captureStatus?.enabled ?? true) ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
            <span
              className={[
                'text-xs font-semibold rounded-full px-2 py-0.5',
                (captureStatus?.enabled ?? true)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700',
              ].join(' ')}
            >
              {(captureStatus?.enabled ?? true) ? t('capture.enabled') : t('capture.disabled')}
            </span>
          </div>
        }
      />

      {/* Estatísticas */}
      {stats && <LogStats stats={stats} t={t} />}

      {/* Busca e filtros */}
      <LogFilters
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSearch={handleSearch}
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={handleClearFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
        stats={stats}
        t={t}
      />

      {/* Tabela de logs */}
      <LogTable
        logsData={logsData}
        logsLoading={logsLoading}
        logGroups={logGroups}
        expandedRows={expandedRows}
        expandedGroups={expandedGroups}
        onToggleRow={toggleRow}
        onToggleGroup={toggleGroup}
        onPageChange={handlePageChange}
        t={t}
      />
    </AppLayout>
  );
}
