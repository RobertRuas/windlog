/**
 * ============================================================================
 * PROJECTS FILTERS - Filtros de Busca de Projetos
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe os filtros de busca de projetos.
 * Inclui busca textual e filtro por status.
 * ============================================================================
 */

import { Search } from 'lucide-react';

/**
 * Props do componente ProjectsFilters.
 */
interface ProjectsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  t: (key: string) => string;
}

/**
 * Componente ProjectsFilters - Filtros de busca de projetos.
 */
export function ProjectsFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  t,
}: ProjectsFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca (sempre visível) */}
        <div className="flex-1 relative h-10">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-full text-sm pl-8 rounded-lg border border-gray-300 dark:border-[#38383a] bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtro por status */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t('filter.allStatuses')}</option>
          <option value="PLANNING">{t('status.PLANNING')}</option>
          <option value="IN_PROGRESS">{t('status.IN_PROGRESS')}</option>
          <option value="ON_HOLD">{t('status.ON_HOLD')}</option>
          <option value="COMPLETED">{t('status.COMPLETED')}</option>
          <option value="CANCELLED">{t('status.CANCELLED')}</option>
        </select>
      </div>
    </div>
  );
}
