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
import { useQuery } from '@tanstack/react-query';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Componentes
import { LogStats } from './components/LogStats';
import { LogFilters } from './components/LogFilters';
import { LogTable, type LogGroup } from './components/LogTable';

// Serviços
import { getLogs, getLogStats, type LogFilters as LogFiltersType, type SystemLog } from '@/services/system-log.service';

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
      {/* Título */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

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
