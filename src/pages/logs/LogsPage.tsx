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
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  ChevronDown,
  Terminal,
  Filter,
} from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Componentes
import { Button } from '@/components/ui/Button';

// Serviços
import { getLogs, getLogStats, type LogFilters, type SystemLog } from '@/services/system-log.service';

/* -------------------------------------------------------------------------- */
/*  Constantes                                                                */
/* -------------------------------------------------------------------------- */

/** Labels legíveis para ações. */
const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_FAILED: 'Login Falhou',
  PASSWORD_CHANGE: 'Alteração de Senha',
  PASSWORD_RESET: 'Reset de Senha',
  USER_CREATE: 'Criar Usuário',
  USER_UPDATE: 'Atualizar Usuário',
  USER_DELETE: 'Excluir Usuário',
  USER_DEACTIVATE: 'Desativar Usuário',
  USER_REACTIVATE: 'Reativar Usuário',
  USER_ROLE_CHANGE: 'Alterar Role',
  PROFILE_UPDATE: 'Atualizar Perfil',
  PROFILE_VIEW: 'Visualizar Perfil',
  PHONE_ADD: 'Adicionar Telefone',
  PHONE_UPDATE: 'Atualizar Telefone',
  PHONE_DELETE: 'Excluir Telefone',
  CERTIFICATION_ADD: 'Adicionar Certificação',
  CERTIFICATION_UPDATE: 'Atualizar Certificação',
  CERTIFICATION_DELETE: 'Excluir Certificação',
  LANGUAGE_ADD: 'Adicionar Idioma',
  LANGUAGE_UPDATE: 'Atualizar Idioma',
  LANGUAGE_DELETE: 'Excluir Idioma',
  PROJECT_CREATE: 'Criar Projeto',
  PROJECT_UPDATE: 'Atualizar Projeto',
  PROJECT_DELETE: 'Excluir Projeto',
  TURBINE_CREATE: 'Criar Turbina',
  TURBINE_UPDATE: 'Atualizar Turbina',
  TURBINE_DELETE: 'Excluir Turbina',
  TECHNICIAN_CREATE: 'Criar Técnico',
  TECHNICIAN_UPDATE: 'Atualizar Técnico',
  TECHNICIAN_DELETE: 'Excluir Técnico',
  SYSTEM_ERROR: 'Erro do Sistema',
  API_ERROR: 'Erro de API',
  ACCESS_DENIED: 'Acesso Negado',
  DATA_EXPORT: 'Exportar Dados',
  DATA_IMPORT: 'Importar Dados',
  OTHER: 'Outro',
};

/** Configuração visual por severidade. */
const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  INFO:     { color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Info' },
  WARNING:  { color: 'text-amber-600',  bg: 'bg-amber-50',  label: 'Aviso' },
  ERROR:    { color: 'text-red-600',    bg: 'bg-red-50',    label: 'Erro' },
  CRITICAL: { color: 'text-purple-600', bg: 'bg-purple-50', label: 'Crítico' },
};

/** Cores para métodos HTTP. */
const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-600',
  POST: 'text-blue-600',
  PUT: 'text-amber-600',
  PATCH: 'text-orange-600',
  DELETE: 'text-red-600',
};

/** Retorna a cor do status code. */
function getStatusColor(status: number | null): string {
  if (!status) return 'text-gray-400';
  if (status >= 500) return 'text-red-600';
  if (status >= 400) return 'text-amber-600';
  if (status >= 300) return 'text-blue-600';
  if (status >= 200) return 'text-emerald-600';
  return 'text-gray-400';
}

/** Formata duração para exibição. */
function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Formata data/hora compacta. */
function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/* -------------------------------------------------------------------------- */
/*  Componente: Linha do log                                                  */
/* -------------------------------------------------------------------------- */

function LogRow({ log, isExpanded, onToggle }: { log: SystemLog; isExpanded: boolean; onToggle: () => void }) {
  const severity = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.INFO;

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
          isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'
        }`}
      >
        {/* Timestamp */}
        <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
          {formatDateTime(log.createdAt)}
        </td>

        {/* Severidade */}
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${severity.color} ${severity.bg}`}>
            {severity.label}
          </span>
        </td>

        {/* Método + URL */}
        <td className="px-4 py-3 text-xs max-w-[240px]">
          <div className="flex items-center gap-2">
            {log.method && (
              <span className={`font-mono font-semibold text-[11px] ${METHOD_COLORS[log.method] || 'text-gray-500'}`}>
                {log.method}
              </span>
            )}
            <span className="text-gray-500 truncate font-mono" title={log.url || undefined}>
              {log.url || '—'}
            </span>
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-3 text-xs font-mono font-semibold">
          <span className={getStatusColor(log.statusCode)}>
            {log.statusCode || '—'}
          </span>
        </td>

        {/* Duração */}
        <td className="px-4 py-3 text-xs text-gray-500 font-mono">
          {formatDuration(log.duration)}
        </td>

        {/* Ação */}
        <td className="px-4 py-3 text-xs text-gray-700">
          {ACTION_LABELS[log.action] || log.action}
        </td>

        {/* Usuário */}
        <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[150px]">
          {log.userEmail || log.userName || '—'}
        </td>

        {/* Expand */}
        <td className="px-4 py-3 w-8">
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </td>
      </tr>

      {/* Detalhes expandidos */}
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-4 py-4">
            <div className="ml-3 pl-4 border-l-2 border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-gray-400 mb-1">IP Address</div>
                  <div className="font-mono text-gray-700">{log.ipAddress || '—'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-400 mb-1">User Agent</div>
                  <div className="font-mono text-gray-500 truncate" title={log.userAgent || undefined}>
                    {log.userAgent || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Entidade</div>
                  <div className="font-mono text-gray-700">
                    {log.entity ? `${log.entity}${log.entityName ? ` — ${log.entityName}` : ''}` : '—'}
                  </div>
                </div>
                <div className="col-span-2 md:col-span-4">
                  <div className="text-gray-400 mb-1">Mensagem</div>
                  <div className="text-gray-700">{log.message}</div>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="col-span-2 md:col-span-4">
                    <div className="text-gray-400 mb-1">Detalhes</div>
                    <pre className="font-mono text-[11px] text-gray-600 bg-white rounded-lg border border-gray-200 p-3 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Componente principal                                                      */
/* -------------------------------------------------------------------------- */

export function LogsPage() {
  const [filters, setFilters] = useState<LogFilters>({ page: 1, limit: 50 });
  const [searchInput, setSearchInput] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
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

  /** Verifica se há filtros ativos. */
  const hasActiveFilters = useMemo(() => {
    return !!(filters.search || filters.action || filters.severity || filters.startDate || filters.endDate);
  }, [filters]);

  /** Contador de filtros ativos. */
  const activeFilterCount = useMemo(() => {
    return [filters.action, filters.severity, filters.startDate, filters.endDate].filter(Boolean).length;
  }, [filters]);

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

  return (
    <AppLayout>
      {/* Título */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Logs do Sistema</h1>
        <p className="text-sm text-gray-500 mt-1">Monitoramento e auditoria em tempo real</p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Activity size={20} className="text-gray-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-semibold text-gray-900">{stats.total.toLocaleString('pt-PT')}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Erros</p>
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
              <p className="text-xs text-gray-500">Avisos</p>
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
              <p className="text-xs text-gray-500">Críticos</p>
              <p className="text-sm font-semibold text-gray-900">
                {stats.bySeverity.find((s) => s.severity === 'CRITICAL')?.count || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Busca e filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por mensagem, usuário..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="form-input text-sm w-full pl-9"
            />
          </div>
          <Button onClick={handleSearch} variant="primary" size="sm">
            Buscar
          </Button>
          <Button
            onClick={() => setShowFilters((v) => !v)}
            variant="secondary"
            size="sm"
          >
            <Filter size={14} className="mr-1.5" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-semibold">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button onClick={handleClearFilters} variant="secondary" size="sm">
              <RefreshCw size={14} className="mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Filtros avançados */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Ação</label>
                <select
                  value={filters.action || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value || undefined, page: 1 }))}
                  className="form-select text-sm w-full"
                >
                  <option value="">Todas</option>
                  {stats?.byAction.map((item) => (
                    <option key={item.action} value={item.action}>
                      {ACTION_LABELS[item.action] || item.action} ({item.count})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Severidade</label>
                <select
                  value={filters.severity || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value || undefined, page: 1 }))}
                  className="form-select text-sm w-full"
                >
                  <option value="">Todas</option>
                  {stats?.bySeverity.map((item) => (
                    <option key={item.severity} value={item.severity}>
                      {SEVERITY_CONFIG[item.severity]?.label || item.severity} ({item.count})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Data inicial</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value || undefined, page: 1 }))}
                  className="form-input text-sm w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Data final</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value || undefined, page: 1 }))}
                  className="form-input text-sm w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de logs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header da tabela */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {logsLoading ? 'Carregando...' : `${logsData?.total.toLocaleString('pt-PT') ?? 0} registros`}
          </p>
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400">
              <RefreshCw size={18} className="animate-spin" />
              <p className="text-sm">Carregando logs...</p>
            </div>
          </div>
        ) : !logsData || logsData.data.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Terminal size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhum log encontrado</p>
              <p className="text-xs text-gray-400 mt-1">Tente ajustar os filtros</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Data</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Nível</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Request</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Duração</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Ação</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Usuário</th>
                    <th className="px-4 py-2.5 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {logsData.data.map((log) => (
                    <LogRow
                      key={log.id}
                      log={log}
                      isExpanded={expandedRows.has(log.id)}
                      onToggle={() => toggleRow(log.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {(logsData.totalPages ?? 0) > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Página {logsData.page} de {logsData.totalPages}
                  <span className="text-gray-400 ml-2">({logsData.total.toLocaleString('pt-PT')} registros)</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePageChange(logsData.page - 1)}
                    disabled={!logsData.hasPreviousPage}
                    variant="secondary"
                    size="sm"
                  >
                    <ChevronLeft size={14} className="mr-1" />
                    Anterior
                  </Button>
                  <Button
                    onClick={() => handlePageChange(logsData.page + 1)}
                    disabled={!logsData.hasNextPage}
                    variant="secondary"
                    size="sm"
                  >
                    Próxima
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
