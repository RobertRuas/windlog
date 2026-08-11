/**
 * ============================================================================
 * USERS FILTERS - Filtros de Busca de Usuários
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe os filtros de busca de usuários.
 * Inclui busca textual e filtro por role.
 *
 * PROPS:
 * ------
 * - search: valor atual da busca
 * - onSearchChange: função chamada ao digitar na busca
 * - roleFilter: role selecionado
 * - onRoleChange: função chamada ao alterar o role
 * - t: função de tradução
 * ============================================================================
 */

import { Search } from 'lucide-react';

/**
 * Props do componente UsersFilters.
 */
interface UsersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleChange: (role: string) => void;
  t: (key: string) => string;
}

/**
 * Componente UsersFilters - Filtros de busca de usuários.
 */
export function UsersFilters({
  search,
  onSearchChange,
  roleFilter,
  onRoleChange,
  t,
}: UsersFiltersProps) {
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

        {/* Filtro por role */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
          className="form-select"
        >
          <option value="">{t('filter.allRoles')}</option>
          <option value="ADMIN">{t('roles.ADMIN')}</option>
          <option value="HR">{t('roles.HR')}</option>
          <option value="STANDARD">{t('roles.STANDARD')}</option>
        </select>
      </div>
    </div>
  );
}
