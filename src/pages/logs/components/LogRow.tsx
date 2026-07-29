/**
 * ============================================================================
 * LOG ROW - Linha do Log na Tabela
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe uma linha do log na tabela.
 * Pode ser expandido para mostrar detalhes completos.
 *
 * PROPS:
 * ------
 * - log: dados do log
 * - isExpanded: se a linha está expandida
 * - onToggle: função para expandir/recolher
 * - t: função de tradução
 * ============================================================================
 */

import { ChevronDown } from 'lucide-react';
import type { SystemLog } from '@/services/system-log.service';

/* -------------------------------------------------------------------------- */
/*  Constantes                                                                */
/* -------------------------------------------------------------------------- */

/** Configuração visual por severidade. */
const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  INFO:     { color: 'text-blue-600',   bg: 'bg-blue-50' },
  WARNING:  { color: 'text-amber-600',  bg: 'bg-amber-50' },
  ERROR:    { color: 'text-red-600',    bg: 'bg-red-50' },
  CRITICAL: { color: 'text-purple-600', bg: 'bg-purple-50' },
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

/**
 * Props do componente LogRow.
 */
interface LogRowProps {
  log: SystemLog;
  isExpanded: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}

/**
 * Componente LogRow - Linha do log na tabela.
 */
export function LogRow({ log, isExpanded, onToggle, t }: LogRowProps) {
  const severityKey = log.severity?.toLowerCase() || 'info';
  const severityStyle = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.INFO;

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
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${severityStyle.color} ${severityStyle.bg}`}>
            {t(`severity.${severityKey}`)}
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
          {t(`actions.${log.action}`) || log.action}
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
                  <div className="text-gray-400 mb-1">{t('details.ipAddress')}</div>
                  <div className="font-mono text-gray-700">{log.ipAddress || '—'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-400 mb-1">{t('details.userAgent')}</div>
                  <div className="font-mono text-gray-500 truncate" title={log.userAgent || undefined}>
                    {log.userAgent || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">{t('details.entity')}</div>
                  <div className="font-mono text-gray-700">
                    {log.entity ? `${log.entity}${log.entityName ? ` — ${log.entityName}` : ''}` : '—'}
                  </div>
                </div>
                <div className="col-span-2 md:col-span-4">
                  <div className="text-gray-400 mb-1">{t('details.message')}</div>
                  <div className="text-gray-700">{log.message}</div>
                </div>
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="col-span-2 md:col-span-4">
                    <div className="text-gray-400 mb-1">{t('details.details')}</div>
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

// Exporta constantes e funções utilitárias para uso em outros componentes
export { SEVERITY_CONFIG, METHOD_COLORS, getStatusColor, formatDuration, formatDateTime };
