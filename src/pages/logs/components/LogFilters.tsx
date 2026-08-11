/**
 * ============================================================================
 * LOG FILTERS - Filtros de Busca dos Logs
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe os filtros de busca dos logs.
 * Inclui busca textual e filtros avançados (ação, severidade, datas).
 *
 * PROPS:
 * ------
 * - searchInput: valor atual da busca
 * - onSearchChange: função chamada ao digitar na busca
 * - onSearch: função chamada ao clicar em buscar
 * - filters: filtros ativos
 * - onFilterChange: função chamada ao alterar um filtro
 * - onClearFilters: função chamada ao limpar filtros
 * - showFilters: se os filtros avançados estão visíveis
 * - onToggleFilters: função chamada ao mostrar/esconder filtros
 * - stats: estatísticas dos logs (para popular selects)
 * - t: função de tradução
 * ============================================================================
 */

import { useState } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { LogFilters } from '@/services/system-log.service';

/**
 * Props do componente LogFilters.
 */
interface LogFiltersProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  filters: LogFilters;
  onFilterChange: (filters: LogFilters) => void;
  onClearFilters: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  stats?: {
    byAction: { action: string; count: number }[];
    bySeverity: { severity: string; count: number }[];
  };
  t: (key: string) => string;
}

/**
 * Componente LogFilters - Filtros de busca dos logs.
 */
export function LogFilters({
  searchInput,
  onSearchChange,
  onSearch,
  filters,
  onFilterChange,
  onClearFilters,
  showFilters,
  onToggleFilters,
  stats,
  t,
}: LogFiltersProps) {
  /** Estado local: campo de busca visível */
  const [showSearch, setShowSearch] = useState(false);

  /** Verifica se há filtros ativos. */
  const hasActiveFilters = !!(
    filters.search || filters.action || filters.severity || filters.startDate || filters.endDate
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-2">
        {/* Botão busca (toggle campo) */}
        {!showSearch ? (
          <button
            onClick={() => setShowSearch(true)}
            className="form-button form-button-secondary"
            title={t('search.placeholder')}
          >
            <Search size={15} />
          </button>
        ) : (
          <div className="relative flex-1 h-10 max-w-sm">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              autoFocus
              type="text"
              placeholder={t('search.placeholder')}
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="w-full h-full text-sm pl-8 pr-10 rounded-lg border border-gray-300 dark:border-[#38383a] bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={onToggleFilters}
              className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md transition-colors ${
                showFilters
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-[#a1a1a6]'
              }`}
              title={t('search.filters')}
            >
              <Filter size={15} />
            </button>
          </div>
        )}

        {/* Botão buscar (quando campo visível) */}
        {showSearch && (
          <Button onClick={onSearch} variant="primary" size="sm">
            {t('search.button')}
          </Button>
        )}

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <Button onClick={onClearFilters} variant="secondary" size="sm">
            <RefreshCw size={14} className="mr-1" />
            {t('search.clear')}
          </Button>
        )}
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('filters.action')}</label>
              <select
                value={filters.action || ''}
                onChange={(e) => onFilterChange({ ...filters, action: e.target.value || undefined, page: 1 })}
                className="form-select text-sm w-full"
              >
                <option value="">{t('filters.all')}</option>
                {stats?.byAction.map((item) => (
                  <option key={item.action} value={item.action}>
                    {t(`actions.${item.action}`) || item.action} ({item.count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('filters.severity')}</label>
              <select
                value={filters.severity || ''}
                onChange={(e) => onFilterChange({ ...filters, severity: e.target.value || undefined, page: 1 })}
                className="form-select text-sm w-full"
              >
                <option value="">{t('filters.all')}</option>
                {stats?.bySeverity.map((item) => (
                  <option key={item.severity} value={item.severity}>
                    {t(`severity.${item.severity.toLowerCase()}`) || item.severity} ({item.count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('filters.startDate')}</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value || undefined, page: 1 })}
                className="form-input text-sm w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('filters.endDate')}</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value || undefined, page: 1 })}
                className="form-input text-sm w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
