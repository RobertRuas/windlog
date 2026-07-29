/**
 * ============================================================================
 * USERS TABLE - Tabela de Usuários com Paginação
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Componente que exibe a tabela de usuários com paginação.
 * Inclui ações de editar e desativar usuário.
 *
 * PROPS:
 * ------
 * - data: dados dos usuários
 * - isLoading: se está carregando
 * - onEdit: função chamada ao editar usuário
 * - onDelete: função chamada ao desativar usuário
 * - onPageChange: função chamada ao mudar de página
 * - t: função de tradução
 * ============================================================================
 */

import { Users as UsersIcon, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import type { UserListItem } from '@/services/user.service';

/**
 * Props do componente UsersTable.
 */
interface UsersTableProps {
  data?: {
    data: UserListItem[];
    page: number;
    totalPages: number;
    total: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  isLoading: boolean;
  onEdit: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
  onPageChange: (page: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Componente UsersTable - Tabela de usuários com paginação.
 */
export function UsersTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  onPageChange,
  t,
}: UsersTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">{t('table.loading')}</div>
      ) : !data?.data.length ? (
        <div className="p-8 text-center text-gray-500">
          <UsersIcon size={48} className="mx-auto mb-3 text-gray-300" />
          <p>{t('table.empty')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.name')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.email')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.role')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('table.status')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'HR'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role === 'ADMIN' ? t('roles.adminShort') : user.role === 'HR' ? t('roles.hrShort') : t('roles.standardShort')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? t('status.active') : t('status.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(user)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title={t('actions.edit')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(user)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title={t('actions.deactivate')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {t('table.pagination', { page: data.page, totalPages: data.totalPages, total: data.total })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(data.page - 1)}
                  disabled={!data.hasPreviousPage}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => onPageChange(data.page + 1)}
                  disabled={!data.hasNextPage}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
