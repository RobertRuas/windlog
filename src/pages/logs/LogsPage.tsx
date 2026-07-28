/**
 * ============================================================================
 * LOGS PAGE - Página de Logs do Sistema
 * ============================================================================
 *
 * Página exclusiva para administradores visualizarem os logs do sistema.
 * Design profissional com estatísticas, filtros compactos e tabela elegante.
 *
 * SEGURANÇA: Apenas administradores (ADMIN) podem acessar.
 * ============================================================================
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Clock,
  Globe,
  ChevronDown,
  Terminal,
  Filter,
  X,
  ArrowUpDown,
} from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Componentes
import { Button } from '@/components/ui/Button';

// Serviços
import { getLogs, getLogStats, type LogFilters, type SystemLog } from '@/services/system-log.service';

/* -------------------------------------------------------------------------- */
/*  Constantes de configuração visual                                         */
/* -------------------------------------------------------------------------- */

/** Mapeamento de ações para labels legíveis em português. */
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

/** Configuração visual por severidade (tema claro). */
const SEVERITY_CONFIG = {
  INFO: {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    icon: Info,
    label: 'Info',
  },
  WARNING: {
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: AlertTriangle,
    label: 'Aviso',
  },
  ERROR: {
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    icon: XCircle,
    label: 'Erro',
  },
  CRITICAL: {
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    icon: AlertCircle,
    label: 'Crítico',
  },
};

/** Cores para métodos HTTP (tema claro). */
const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-700 bg-emerald-50',
  POST: 'text-blue-700 bg-blue-50',
  PUT: 'text-amber-700 bg-amber-50',
  PATCH: 'text-orange-700 bg-orange-50',
  DELETE: 'text-red-700 bg-red-50',
};

/** Retorna a cor do badge de status code (tema claro). */
function getStatusBadge(status: number | null): { color: string; bg: string } {
  if (!status) return { color: 'text-gray-500', bg: 'bg-gray-50' };
  if (status >= 500) return { color: 'text-red-700', bg: 'bg-red-50' };
  if (status >= 400) return { color: 'text-amber-700', bg: 'bg-amber-50' };
  if (status >= 300) return { color: 'text-blue-700', bg: 'bg-blue-50' };
  if (status >= 200) return { color: 'text-emerald-700', bg: 'bg-emerald-50' };
  return { color: 'text-gray-500', bg: 'bg-gray-50' };
}

/** Formata a duração para exibição legível. */
function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Formata a data/hora para exibição compacta. */
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
/*  Componente: Linha expansível do log                                       */
/* -------------------------------------------------------------------------- */

function LogRow({ log, isExpanded, onToggle }: { log: SystemLog; isExpanded: boolean; onToggle: () => void }) {
  const severityConfig = SEVERITY_CONFIG[log.severity as keyof typeof SEVERITY_CONFIG];
  const SeverityIcon = severityConfig.icon;
  const statusBadge = getStatusBadge(log.statusCode);

  return (
    <>
      {/* Linha principal */}
      <tr
        onClick={onToggle}
        className={`
          group cursor-pointer transition-colors border-b border-gray-100 last:border-b-0
          ${isExpanded ? 'bg-gray-50/80' : 'hover:bg-gray-50/50'}
        `}
      >
        {/* Timestamp */}
        <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap w-[130px]">
          {formatDateTime(log.createdAt)}
        </td>

        {/* Severidade */}
        <td className="px-4 py-3 w-[100px]">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${severityConfig.color} ${severityConfig.bg}`}>
            <SeverityIcon size={10} />
            {severityConfig.label}
          </span>
        </td>

        {/* Método + URL */}
        <td className="px-4 py-3 text-xs max-w-[250px]">
          <div className="flex items-center gap-2">
            {log.method && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${METHOD_COLORS[log.method] || 'text-gray-600 bg-gray-100'}`}>
                {log.method}
              </span>
            )}
            <span className="text-gray-600 truncate font-mono" title={log.url || undefined}>
              {log.url || '—'}
            </span>
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-3 w-[80px]">
          {log.statusCode ? (
            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold font-mono ${statusBadge.color} ${statusBadge.bg}`}>
              {log.statusCode}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </td>

        {/* Duração */}
        <td className="px-4 py-3 text-xs text-gray-500 font-mono w-[80px]">
          {formatDuration(log.duration)}
        </td>

        {/* Ação */}
        <td className="px-4 py-3 text-xs text-gray-700 font-medium w-[140px]">
          {ACTION_LABELS[log.action] || log.action}
        </td>

        {/* Usuário */}
        <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[160px]">
          {log.userEmail || log.userName || '—'}
        </td>

        {/* Expand indicator */}
        <td className="px-4 py-3 w-[32px]">
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </td>
      </tr>

      {/* Painel expandido com detalhes */}
      {isExpanded && (
        <tr className="bg-gray-50/60">
          <td colSpan={8} className="px-4 py-0">
            <div className="py-4 pl-4 border-l-2 border-blue-200 ml-2 mb-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-xs">
                {/* IP Address */}
                <div>
                  <div className="text-gray-400 mb-1 flex items-center gap-1 font-medium uppercase tracking-wider text-[10px]">
                    <Globe size={10} />
                    IP Address
                  </div>
                  <div className="font-mono text-gray-700">{log.ipAddress || '—'}</div>
                </div>

                {/* User Agent */}
                <div className="col-span-2">
                  <div className="text-gray-400 mb-1 font-medium uppercase tracking-wider text-[10px]">User Agent</div>
                  <div className="font-mono text-gray-500 truncate" title={log.userAgent || undefined}>
                    {log.userAgent || '—'}
                  </div>
                </div>

                {/* Entity */}
                <div>
                  <div className="text-gray-400 mb-1 font-medium uppercase tracking-wider text-[10px]">Entidade</div>
                  <div className="font-mono text-gray-700">
                    {log.entity ? `${log.entity}${log.entityName ? ` — ${log.entityName}` : ''}` : '—'}
                  </div>
                </div>

                {/* Message */}
                <div className="col-span-2 md:col-span-4">
                  <div className="text-gray-400 mb-1 font-medium uppercase tracking-wider text-[10px]">Mensagem</div>
                  <div className="text-gray-700 leading-relaxed">{log.message}</div>
                </div>

                {/* Details JSON */}
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="col-span-2 md:col-span-4">
                    <div className="text-gray-400 mb-1 font-medium uppercase tracking-wider text-[10px]">Detalhes</div>
                    <pre className="font-mono text-[11px] text-gray-600 bg-white rounded-lg border border-gray-200 p-3 overflow-x-auto leading-relaxed">
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
/*  Componente: Card de estatística                                           */
/* -------------------------------------------------------------------------- */

function StatCard({ icon: Icon, label, value, color, bgColor }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 min-w-[160px]">
      <div className={`w-9 h-9 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</div>
        <div className="text-lg font-bold text-gray-900 truncate">{typeof value === 'number' ? value.toLocaleString('pt-PT') : value}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Componente principal: LogsPage                                            */
/* -------------------------------------------------------------------------- */

type SortField = 'createdAt' | 'severity' | 'statusCode' | 'duration';
type SortDir = 'asc' | 'desc';

export function LogsPage() {
  // Estados dos filtros
  const [filters, setFilters] = useState<LogFilters>({
    page: 1,
    limit: 50,
  });
  const [searchInput, setSearchInput] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Busca logs com filtros
  const { data: logsData, isLoading: logsLoading, refetch } = useQuery({
    queryKey: ['system-logs', filters],
    queryFn: () => getLogs(filters),
    refetchInterval: 30000,
  });

  // Busca estatísticas
  const { data: stats } = useQuery({
    queryKey: ['system-logs-stats'],
    queryFn: getLogStats,
    refetchInterval: 60000,
  });

  /** Verifica se há filtros ativos além de paginação. */
  const hasActiveFilters = useMemo(() => {
    return !!(filters.search || filters.action || filters.severity || filters.startDate || filters.endDate);
  }, [filters]);

  /** Aplica a busca textual. */
  function handleSearch() {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  }

  /** Limpa todos os filtros. */
  function handleClearFilters() {
    setFilters({ page: 1, limit: 50 });
    setSearchInput('');
  }

  /** Muda para a página anterior/próxima. */
  function handlePageChange(newPage: number) {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }

  /** Toggle expand/collapse de uma linha. */
  function toggleRow(logId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  }

  /** Expande todas as linhas. */
  function expandAll() {
    if (logsData) setExpandedRows(new Set(logsData.data.map((l) => l.id)));
  }

  /** Colapsa todas as linhas. */
  function collapseAll() {
    setExpandedRows(new Set());
  }

  /** Alterna a ordenação por coluna. */
  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  /** Dados ordenados no frontend (os demais filtros já vêm da API). */
  const sortedLogs = useMemo(() => {
    if (!logsData?.data) return [];
    const arr = [...logsData.data];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'severity': {
          const order = { INFO: 0, WARNING: 1, ERROR: 2, CRITICAL: 3 };
          cmp = (order[a.severity] ?? 0) - (order[b.severity] ?? 0);
          break;
        }
        case 'statusCode':
          cmp = (a.statusCode ?? 0) - (b.statusCode ?? 0);
          break;
        case 'duration':
          cmp = (a.duration ?? 0) - (b.duration ?? 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [logsData, sortField, sortDir]);

  /** Contador de filtros ativos. */
  const activeFilterCount = [filters.action, filters.severity, filters.startDate, filters.endDate].filter(Boolean).length;

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Terminal size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Logs do Sistema</h1>
            <p className="text-sm text-gray-500">Monitoramento e auditoria em tempo real</p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
          <StatCard
            icon={Activity}
            label="Total"
            value={stats.total}
            color="text-gray-700"
            bgColor="bg-gray-100"
          />
          <StatCard
            icon={XCircle}
            label="Erros"
            value={stats.bySeverity.find((s) => s.severity === 'ERROR')?.count || 0}
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <StatCard
            icon={AlertTriangle}
            label="Avisos"
            value={stats.bySeverity.find((s) => s.severity === 'WARNING')?.count || 0}
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <StatCard
            icon={AlertCircle}
            label="Críticos"
            value={stats.bySeverity.find((s) => s.severity === 'CRITICAL')?.count || 0}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>
      )}

      {/* Barra de busca + toggle filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por mensagem, usuário, entidade..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="form-input text-sm w-full pl-9"
            />
          </div>

          <Button onClick={handleSearch} variant="primary" size="sm">
            Buscar
          </Button>

          {/* Toggle filtros avançados */}
          <Button
            onClick={() => setShowFilters((v) => !v)}
            variant="secondary"
            size="sm"
            className="relative"
          >
            <Filter size={13} className="mr-1.5" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Limpar */}
          {hasActiveFilters && (
            <Button onClick={handleClearFilters} variant="secondary" size="sm">
              <X size={13} className="mr-1" />
              Limpar
            </Button>
          )}

          {/* Refresh */}
          <Button onClick={() => refetch()} variant="secondary" size="sm">
            <RefreshCw size={13} className="mr-1" />
            Atualizar
          </Button>
        </div>

        {/* Filtros avançados (expansível) */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[160px]">
                <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1 block">Ação</label>
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

              <div className="min-w-[140px]">
                <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1 block">Severidade</label>
                <select
                  value={filters.severity || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value || undefined, page: 1 }))}
                  className="form-select text-sm w-full"
                >
                  <option value="">Todas</option>
                  {stats?.bySeverity.map((item) => (
                    <option key={item.severity} value={item.severity}>
                      {SEVERITY_CONFIG[item.severity as keyof typeof SEVERITY_CONFIG]?.label || item.severity} ({item.count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-[150px]">
                <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1 block">Data Inicial</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value || undefined, page: 1 }))}
                  className="form-input text-sm w-full"
                />
              </div>

              <div className="min-w-[150px]">
                <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1 block">Data Final</label>
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

      {/* Tabela de Logs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header da tabela com controles */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {logsLoading ? 'Carregando...' : `${logsData?.total.toLocaleString('pt-PT') ?? 0} registros`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={expandAll} variant="secondary" size="sm" className="text-xs h-7">
              <ChevronDown size={12} className="mr-1" />
              Expandir
            </Button>
            <Button onClick={collapseAll} variant="secondary" size="sm" className="text-xs h-7">
              <ChevronDown size={12} className="mr-1 rotate-180" />
              Colapsar
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        {logsLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3 text-gray-400">
              <RefreshCw size={20} className="animate-spin" />
              <span className="text-sm">Carregando logs...</span>
            </div>
          </div>
        ) : !logsData || logsData.data.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Terminal size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">Nenhum log encontrado</p>
              <p className="text-xs text-gray-400 mt-1">Tente ajustar os filtros ou aguarde novas atividades</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th
                      onClick={() => toggleSort('createdAt')}
                      className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none w-[130px]"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} />
                        Data
                        <ArrowUpDown size={10} className={sortField === 'createdAt' ? 'text-blue-500' : 'text-gray-300'} />
                      </span>
                    </th>
                    <th
                      onClick={() => toggleSort('severity')}
                      className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none w-[100px]"
                    >
                      <span className="inline-flex items-center gap-1">
                        Nível
                        <ArrowUpDown size={10} className={sortField === 'severity' ? 'text-blue-500' : 'text-gray-300'} />
                      </span>
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Request
                    </th>
                    <th
                      onClick={() => toggleSort('statusCode')}
                      className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none w-[80px]"
                    >
                      <span className="inline-flex items-center gap-1">
                        Status
                        <ArrowUpDown size={10} className={sortField === 'statusCode' ? 'text-blue-500' : 'text-gray-300'} />
                      </span>
                    </th>
                    <th
                      onClick={() => toggleSort('duration')}
                      className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none w-[80px]"
                    >
                      <span className="inline-flex items-center gap-1">
                        Duração
                        <ArrowUpDown size={10} className={sortField === 'duration' ? 'text-blue-500' : 'text-gray-300'} />
                      </span>
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[140px]">
                      Ação
                    </th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[160px]">
                      Usuário
                    </th>
                    <th className="px-4 py-2.5 w-[32px]" />
                  </tr>
                </thead>
                <tbody>
                  {sortedLogs.map((log) => (
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
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="text-xs text-gray-500">
                  Página {logsData.page} de {logsData.totalPages}
                  <span className="text-gray-400 ml-2">({logsData.total.toLocaleString('pt-PT')} registros)</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePageChange(logsData.page - 1)}
                    disabled={!logsData.hasPreviousPage}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
                    <ChevronLeft size={14} className="mr-1" />
                    Anterior
                  </Button>
                  <Button
                    onClick={() => handlePageChange(logsData.page + 1)}
                    disabled={!logsData.hasNextPage}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
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
