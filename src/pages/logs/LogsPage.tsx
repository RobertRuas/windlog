/**
 * ============================================================================
 * LOGS PAGE - Página de Logs do Sistema (Redesenhada)
 * ============================================================================
 *
 * O QUE É ESTA PÁGINA?
 * --------------------
 * Página exclusiva para administradores visualizarem os logs do sistema.
 * Design moderno com estatísticas visuais e tabela estilo console.
 *
 * FUNCIONALIDADES:
 * ----------------
 * - Dashboard com estatísticas visuais (cards coloridos)
 * - Filtros organizados por categoria
 * - Tabela estilo console/terminal (fundo escuro, fonte mono)
 * - Linhas expansíveis para ver detalhes completos
 * - Badges coloridos para métodos HTTP e status codes
 * - Navegação fácil com paginação intuitiva
 *
 * SEGURANÇA:
 * ----------
 * - Apenas administradores (ADMIN) podem acessar
 * - Rota protegida no App.tsx
 * ============================================================================
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Zap,
  Users,
  TrendingUp,
  Clock,
  Globe,
  ChevronDown,
  ChevronUp,
  Terminal,
} from 'lucide-react';

// Layout
import { AppLayout } from '@/components/layout/AppLayout';

// Componentes
import { Button } from '@/components/ui/Button';

// Serviços
import { getLogs, getLogStats, type LogFilters, type SystemLog } from '@/services/system-log.service';

/**
 * Mapeamento de ações para labels legíveis.
 */
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

/**
 * Mapeamento de severidades para cores e ícones (tema claro).
 */
const SEVERITY_CONFIG = {
  INFO: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, label: 'INFO' },
  WARNING: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, label: 'WARN' },
  ERROR: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'ERROR' },
  CRITICAL: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: AlertCircle, label: 'CRIT' },
};

/**
 * Cores para métodos HTTP.
 */
const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  PATCH: 'text-orange-400',
  DELETE: 'text-red-400',
};

/**
 * Cores para status codes.
 */
function getStatusColor(status: number | null): string {
  if (!status) return 'text-gray-500';
  if (status >= 500) return 'text-red-400';
  if (status >= 400) return 'text-amber-400';
  if (status >= 300) return 'text-blue-400';
  if (status >= 200) return 'text-emerald-400';
  return 'text-gray-500';
}

/**
 * Componente de linha expansível do log.
 */
function LogRow({ log, isExpanded, onToggle }: { log: SystemLog; isExpanded: boolean; onToggle: () => void }) {
  const severityConfig = SEVERITY_CONFIG[log.severity as keyof typeof SEVERITY_CONFIG];
  const SeverityIcon = severityConfig.icon;

  return (
    <>
      {/* Linha principal */}
      <tr
        onClick={onToggle}
        className="hover:bg-gray-800/50 cursor-pointer transition-colors border-b border-gray-700/50"
      >
        {/* Timestamp */}
        <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </td>

        {/* Severidade */}
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold ${severityConfig.color} ${severityConfig.bg}`}>
            <SeverityIcon size={10} />
            {severityConfig.label}
          </span>
        </td>

        {/* Método + URL */}
        <td className="px-4 py-3 font-mono text-xs">
          <span className={METHOD_COLORS[log.method || ''] || 'text-gray-400'}>
            {log.method || '---'}
          </span>
          <span className="text-gray-500 ml-2">{log.url || '-'}</span>
        </td>

        {/* Status */}
        <td className="px-4 py-3 font-mono text-xs font-bold">
          <span className={getStatusColor(log.statusCode)}>
            {log.statusCode || '---'}
          </span>
        </td>

        {/* Duração */}
        <td className="px-4 py-3 font-mono text-xs text-gray-400">
          {log.duration ? `${log.duration}ms` : '-'}
        </td>

        {/* Ação */}
        <td className="px-4 py-3 text-xs text-gray-300">
          {ACTION_LABELS[log.action] || log.action}
        </td>

        {/* Usuário */}
        <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[150px]">
          {log.userEmail || log.userName || '-'}
        </td>

        {/* Expand indicator */}
        <td className="px-4 py-3 text-gray-500">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>

      {/* Linha expandida com detalhes */}
      {isExpanded && (
        <tr className="bg-gray-800/30">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* IP Address */}
              <div>
                <div className="text-gray-500 mb-1 flex items-center gap-1">
                  <Globe size={10} />
                  IP Address
                </div>
                <div className="font-mono text-gray-300">{log.ipAddress || '-'}</div>
              </div>

              {/* User Agent */}
              <div className="col-span-2">
                <div className="text-gray-500 mb-1">User Agent</div>
                <div className="font-mono text-gray-400 truncate" title={log.userAgent || undefined}>
                  {log.userAgent || '-'}
                </div>
              </div>

              {/* Entity */}
              <div>
                <div className="text-gray-500 mb-1">Entidade</div>
                <div className="font-mono text-gray-300">
                  {log.entity ? `${log.entity}${log.entityName ? ` (${log.entityName})` : ''}` : '-'}
                </div>
              </div>

              {/* Message */}
              <div className="col-span-2 md:col-span-3">
                <div className="text-gray-500 mb-1">Mensagem</div>
                <div className="font-mono text-gray-300">{log.message}</div>
              </div>

              {/* Details JSON */}
              {log.details && Object.keys(log.details).length > 0 && (
                <div className="col-span-2 md:col-span-4">
                  <div className="text-gray-500 mb-1">Detalhes</div>
                  <pre className="font-mono text-xs text-gray-400 bg-gray-900/50 rounded p-2 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * Componente LogsPage - Página de logs do sistema.
 */
export function LogsPage() {
  // Estados dos filtros
  const [filters, setFilters] = useState<LogFilters>({
    page: 1,
    limit: 50,
  });
  const [searchInput, setSearchInput] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Busca logs com filtros
  const { data: logsData, isLoading: logsLoading } = useQuery({
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

  /**
   * Aplica a busca textual.
   */
  function handleSearch() {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  }

  /**
   * Limpa todos os filtros.
   */
  function handleClearFilters() {
    setFilters({ page: 1, limit: 50 });
    setSearchInput('');
  }

  /**
   * Muda para a página anterior/próxima.
   */
  function handlePageChange(newPage: number) {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }

  /**
   * Toggle expand/collapse de uma linha.
   */
  function toggleRow(logId: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  }

  /**
   * Expande todas as linhas.
   */
  function expandAll() {
    if (logsData) {
      setExpandedRows(new Set(logsData.data.map((log) => log.id)));
    }
  }

  /**
   * Colapsa todas as linhas.
   */
  function collapseAll() {
    setExpandedRows(new Set());
  }

  return (
    <AppLayout>
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Terminal size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Logs do Sistema</h1>
            <p className="text-sm text-gray-500">
              Monitoramento em tempo real de todas as ações
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard de Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total de Logs */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <Activity size={20} className="opacity-80" />
              <span className="text-xs font-medium opacity-80">Total</span>
            </div>
            <div className="text-3xl font-bold">{stats.total.toLocaleString()}</div>
            <div className="text-xs opacity-70 mt-1">registros</div>
          </div>

          {/* Erros */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg shadow-red-500/20">
            <div className="flex items-center justify-between mb-2">
              <XCircle size={20} className="opacity-80" />
              <span className="text-xs font-medium opacity-80">Erros</span>
            </div>
            <div className="text-3xl font-bold">
              {stats.bySeverity.find((s) => s.severity === 'ERROR')?.count || 0}
            </div>
            <div className="text-xs opacity-70 mt-1">críticos</div>
          </div>

          {/* Avisos */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg shadow-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle size={20} className="opacity-80" />
              <span className="text-xs font-medium opacity-80">Avisos</span>
            </div>
            <div className="text-3xl font-bold">
              {stats.bySeverity.find((s) => s.severity === 'WARNING')?.count || 0}
            </div>
            <div className="text-xs opacity-70 mt-1">atenção</div>
          </div>

          {/* Ação Mais Comum */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={20} className="opacity-80" />
              <span className="text-xs font-medium opacity-80">Top Ação</span>
            </div>
            <div className="text-lg font-bold truncate">
              {stats.byAction[0] ? ACTION_LABELS[stats.byAction[0].action] || stats.byAction[0].action : '-'}
            </div>
            <div className="text-xs opacity-70 mt-1">
              {stats.byAction[0]?.count || 0} execuções
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Filtros</span>
          </div>
          <Button onClick={handleClearFilters} variant="secondary" size="sm">
            <RefreshCw size={14} className="mr-1" />
            Limpar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca textual */}
          <div className="lg:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Buscar</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Mensagem, usuário, URL..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="form-input flex-1"
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search size={16} />
              </Button>
            </div>
          </div>

          {/* Filtro por ação */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Ação</label>
            <select
              value={filters.action || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value || undefined, page: 1 }))}
              className="form-select w-full"
            >
              <option value="">Todas</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por severidade */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Severidade</label>
            <select
              value={filters.severity || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value || undefined, page: 1 }))}
              className="form-select w-full"
            >
              <option value="">Todas</option>
              <option value="INFO">Informação</option>
              <option value="WARNING">Aviso</option>
              <option value="ERROR">Erro</option>
              <option value="CRITICAL">Crítico</option>
            </select>
          </div>

          {/* Filtro por data inicial */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Data Inicial</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value || undefined, page: 1 }))}
              className="form-input w-full"
            />
          </div>

          {/* Filtro por data final */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Data Final</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value || undefined, page: 1 }))}
              className="form-input w-full"
            />
          </div>
        </div>
      </div>

      {/* Tabela de Logs - Estilo Console */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
        {/* Header da tabela */}
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            </div>
            <span className="text-xs font-mono text-gray-400 ml-2">system-logs</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={expandAll}
              variant="secondary"
              size="sm"
              className="text-xs h-7"
            >
              <ChevronDown size={12} className="mr-1" />
              Expandir
            </Button>
            <Button
              onClick={collapseAll}
              variant="secondary"
              size="sm"
              className="text-xs h-7"
            >
              <ChevronUp size={12} className="mr-1" />
              Colapsar
            </Button>
          </div>
        </div>

        {/* Conteúdo */}
        {logsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400">
              <RefreshCw size={20} className="animate-spin" />
              <span className="font-mono text-sm">Carregando logs...</span>
            </div>
          </div>
        ) : !logsData || logsData.data.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Terminal size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="font-mono text-gray-400">Nenhum log encontrado</p>
              <p className="font-mono text-xs text-gray-600 mt-1">Tente ajustar os filtros</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-mono font-medium text-gray-500 uppercase">
                      <Clock size={12} className="inline mr-1" />
                      Timestamp
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-mono font-medium text-gray-500 uppercase">
                      Level
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-mono font-medium text-gray-500 uppercase">
                      Request
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-mono font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-mono font-medium text-gray-500 uppercase">
                      <Zap size={12} className="inline mr-1" />
                      Duration
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-mono font-medium text-gray-500 uppercase">
                      Action
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-mono font-medium text-gray-500 uppercase">
                      <Users size={12} className="inline mr-1" />
                      User
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-mono font-medium text-gray-500 uppercase w-8">
                      
                    </th>
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
            {logsData.totalPages > 1 && (
              <div className="bg-gray-800 px-4 py-3 border-t border-gray-700 flex items-center justify-between">
                <div className="font-mono text-xs text-gray-400">
                  Página {logsData.page} de {logsData.totalPages}
                  <span className="text-gray-600 ml-2">({logsData.total.toLocaleString()} registros)</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePageChange(logsData.page - 1)}
                    disabled={!logsData.hasPreviousPage}
                    variant="secondary"
                    size="sm"
                    className="font-mono text-xs"
                  >
                    <ChevronLeft size={14} className="mr-1" />
                    Anterior
                  </Button>
                  <Button
                    onClick={() => handlePageChange(logsData.page + 1)}
                    disabled={!logsData.hasNextPage}
                    variant="secondary"
                    size="sm"
                    className="font-mono text-xs"
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
